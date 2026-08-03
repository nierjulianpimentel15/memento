import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, setSessionCookies } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { loginSchema } from '@/lib/validation/schemas';
import { checkAuthRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const { allowed } = checkAuthRateLimit(ip, body.email ?? 'unknown');
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { email, password, rememberMe } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant response shape whether the email exists or not, to avoid
  // leaking which emails are registered.
  const genericError = () => NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  if (!user) return genericError();

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return genericError();

  const access = await signAccessToken({ userId: user.id, username: user.username });
  const refresh = await signRefreshToken({ userId: user.id, username: user.username });
  await setSessionCookies(access, refresh, rememberMe);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: refresh,
      userAgent: req.headers.get('user-agent') ?? undefined,
      ipAddress: ip,
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });
}
