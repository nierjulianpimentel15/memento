import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const invite = await prisma.inviteCode.findUnique({
    where: { code: params.code },
    include: { group: { select: { id: true, name: true, description: true, coverImage: true } } },
  });
  if (!invite) return NextResponse.json({ error: 'Invalid invite code.' }, { status: 404 });
  return NextResponse.json({ group: invite.group });
}

export async function POST(_req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invite = await prisma.inviteCode.findUnique({ where: { code: params.code } });
  if (!invite) return NextResponse.json({ error: 'Invalid invite code.' }, { status: 404 });
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 });
  }
  if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
    return NextResponse.json({ error: 'This invite has reached its use limit.' }, { status: 410 });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: session.userId, groupId: invite.groupId } },
  });
  if (existing) {
    return NextResponse.json({ groupId: invite.groupId, alreadyMember: true });
  }

  await prisma.$transaction([
    prisma.membership.create({ data: { userId: session.userId, groupId: invite.groupId, role: 'MEMBER' } }),
    prisma.inviteCode.update({ where: { id: invite.id }, data: { usedCount: { increment: 1 } } }),
  ]);

  return NextResponse.json({ groupId: invite.groupId, alreadyMember: false }, { status: 201 });
}
