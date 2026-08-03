import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership, canManageGroup } from '@/lib/permissions';

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership || !canManageGroup(membership.role)) {
    return NextResponse.json({ error: 'Only owners and admins can create invites.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const maxUses: number | null = typeof body.maxUses === 'number' ? body.maxUses : null;
  const expiresInDays: number | null = typeof body.expiresInDays === 'number' ? body.expiresInDays : 7;

  const invite = await prisma.inviteCode.create({
    data: {
      code: nanoid(10),
      groupId: params.groupId,
      createdBy: session.userId,
      maxUses,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/invite/${invite.code}`;
  return NextResponse.json({ invite, inviteUrl }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership || !canManageGroup(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const invites = await prisma.inviteCode.findMany({
    where: { groupId: params.groupId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ invites });
}
