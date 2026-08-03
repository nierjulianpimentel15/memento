import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearSessionCookies, getRefreshCookieName } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(getRefreshCookieName())?.value;
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } }).catch(() => {});
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
