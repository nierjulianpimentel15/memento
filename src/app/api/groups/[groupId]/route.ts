import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership, canManageGroup, canDeleteGroup } from '@/lib/permissions';
import { createGroupSchema } from '@/lib/validation/schemas';

export async function GET(_req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json({ group, myRole: membership.role });
}

export async function PATCH(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership || !canManageGroup(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createGroupSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  const group = await prisma.group.update({ where: { id: params.groupId }, data: parsed.data });
  return NextResponse.json({ group });
}

export async function DELETE(_req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership || !canDeleteGroup(membership.role)) {
    return NextResponse.json({ error: 'Only the group owner can delete this group.' }, { status: 403 });
  }

  await prisma.group.delete({ where: { id: params.groupId } });
  return NextResponse.json({ ok: true });
}
