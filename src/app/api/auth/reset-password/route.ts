import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { resetPasswordSchema } from '@/lib/validation/schemas';

const RESET_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? 'dev-only-insecure-secret-change-me'
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(parsed.data.token, RESET_SECRET));
  } catch {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }

  if (payload.purpose !== 'password_reset' || typeof payload.userId !== 'string') {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash } });

  // Invalidate all existing sessions for this user as a precaution.
  await prisma.session.deleteMany({ where: { userId: payload.userId } });

  return NextResponse.json({ ok: true });
}
