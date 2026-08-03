import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { checkAuthRateLimit } from '@/lib/rate-limit';

const RESET_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? 'dev-only-insecure-secret-change-me'
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const { allowed } = checkAuthRateLimit(ip, body.email ?? 'unknown');
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return 200 regardless of whether the user exists, so the
  // response can't be used to enumerate registered emails.
  if (user) {
    const token = await new SignJWT({ userId: user.id, purpose: 'password_reset' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(RESET_SECRET);

    // TODO: wire up a transactional email provider (Resend/Postmark/SES).
    // For now the reset link is logged server-side so the flow is testable
    // without email infrastructure configured.
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    console.info(`[password-reset] ${user.email} -> ${resetUrl}`);
  }

  return NextResponse.json({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' });
}
