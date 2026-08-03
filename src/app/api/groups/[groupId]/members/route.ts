import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership, canManageGroup, canDeleteGroup } from '@/lib/permissions';

export async function GET(_req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const members = await prisma.membership.findMany({
    where: { groupId: params.groupId },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    orderBy: { joinedAt: 'asc' },
  });

  return NextResponse.json({ members });
}

/**
 * Body: { action: 'remove' | 'promote' | 'demote' | 'transfer' | 'leave', targetUserId?: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { action, targetUserId } = body as { action?: string; targetUserId?: string };

  if (action === 'leave') {
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Transfer ownership before leaving, or delete the group instead.' },
        { status: 400 }
      );
    }
    await prisma.membership.delete({ where: { id: membership.id } });
    return NextResponse.json({ ok: true });
  }

  if (!canManageGroup(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId is required.' }, { status: 400 });

  const target = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: targetUserId, groupId: params.groupId } },
  });
  if (!target) return NextResponse.json({ error: 'That user is not a member of this group.' }, { status: 404 });

  switch (action) {
    case 'remove':
      if (target.role === 'OWNER') {
        return NextResponse.json({ error: 'The owner cannot be removed.' }, { status: 400 });
      }
      await prisma.membership.delete({ where: { id: target.id } });
      return NextResponse.json({ ok: true });

    case 'promote':
      await prisma.membership.update({ where: { id: target.id }, data: { role: 'ADMIN' } });
      return NextResponse.json({ ok: true });

    case 'demote':
      await prisma.membership.update({ where: { id: target.id }, data: { role: 'MEMBER' } });
      return NextResponse.json({ ok: true });

    case 'transfer': {
      if (!canDeleteGroup(membership.role)) {
        return NextResponse.json({ error: 'Only the current owner can transfer ownership.' }, { status: 403 });
      }
      await prisma.$transaction([
        prisma.membership.update({ where: { id: membership.id }, data: { role: 'ADMIN' } }),
        prisma.membership.update({ where: { id: target.id }, data: { role: 'OWNER' } }),
        prisma.group.update({ where: { id: params.groupId }, data: { creatorId: targetUserId } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }
}
