import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, setSessionCookies } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { registerSchema } from '@/lib/validation/schemas';
import { checkAuthRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const { allowed } = checkAuthRateLimit(ip, body.email ?? 'unknown');
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { email, username, displayName, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, email: true, username: true },
  });
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    return NextResponse.json({ error: `That ${field} is already taken.` }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, displayName, passwordHash },
    select: { id: true, username: true, displayName: true, email: true, avatarUrl: true },
  });

  const access = await signAccessToken({ userId: user.id, username: user.username });
  const refresh = await signRefreshToken({ userId: user.id, username: user.username });
  await setSessionCookies(access, refresh, true);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: refresh,
      userAgent: req.headers.get('user-agent') ?? undefined,
      ipAddress: ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
