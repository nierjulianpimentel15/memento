import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { createGroupSchema } from '@/lib/validation/schemas';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: session.userId } } },
    include: {
      _count: { select: { posts: true, members: true } },
      members: { where: { userId: session.userId }, select: { role: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      creatorId: session.userId,
      members: { create: { userId: session.userId, role: 'OWNER' } },
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'GROUP_CREATED', targetType: 'Group', targetId: group.id },
  });

  return NextResponse.json({ group }, { status: 201 });
}
