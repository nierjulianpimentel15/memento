import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { joinGroupSchema } from '@/lib/validation/schemas';

// Note: params.groupId is unused here because the invite code alone
// identifies the group (codes are global), but the route is nested under
// /groups/[groupId] for a consistent resource layout with the rest of the API.
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = joinGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'An invite code is required.' }, { status: 400 });
  }

  const invite = await prisma.inviteCode.findUnique({ where: { code: parsed.data.code } });
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
    return NextResponse.json({ error: 'You are already a member of this group.' }, { status: 409 });
  }

  const [membership] = await prisma.$transaction([
    prisma.membership.create({ data: { userId: session.userId, groupId: invite.groupId, role: 'MEMBER' } }),
    prisma.inviteCode.update({ where: { id: invite.id }, data: { usedCount: { increment: 1 } } }),
  ]);

  // Notify existing members that someone joined.
  const otherMembers = await prisma.membership.findMany({
    where: { groupId: invite.groupId, userId: { not: session.userId } },
    select: { userId: true },
  });
  if (otherMembers.length) {
    await prisma.notification.createMany({
      data: otherMembers.map((m: { userId: string }) => ({
        userId: m.userId,
        groupId: invite.groupId,
        type: 'MEMBER_JOINED' as const,
        message: 'A new member joined your group.',
        link: `/groups/${invite.groupId}`,
      })),
    });
  }

  return NextResponse.json({ membership }, { status: 201 });
}
