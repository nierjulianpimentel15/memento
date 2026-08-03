import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: session.userId, read: false } });

  return NextResponse.json({ notifications, unreadCount });
}

/** Body: { ids: string[] } — mark specific notifications read, or omit for "mark all read". */
export async function PATCH(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

  await prisma.notification.updateMany({
    where: { userId: session.userId, ...(ids ? { id: { in: ids } } : {}) },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
