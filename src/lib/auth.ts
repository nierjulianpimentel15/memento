import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// NOTE: this file is imported by src/middleware.ts, which runs in the Edge
// Runtime. Keep it free of Node-only APIs (like argon2, which uses native
// bindings) — password hashing lives in src/lib/password.ts instead, kept
// separate so it never gets pulled into the Edge bundle.

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? 'dev-only-insecure-secret-change-me'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? 'dev-only-insecure-refresh-change-me'
);

const ACCESS_TOKEN_COOKIE = 'memento_access';
const REFRESH_TOKEN_COOKIE = 'memento_refresh';

export interface SessionPayload {
  userId: string;
  username: string;
}

// --- JWT issuing / verification ---

export async function signAccessToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.ACCESS_TOKEN_TTL ?? '15m')
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_TOKEN_TTL ?? '30d')
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// --- Cookie helpers (HTTP-only, secure, SameSite=Lax) ---

const isProd = process.env.NODE_ENV === 'production';

export async function setSessionCookies(access: string, refresh: string, rememberMe: boolean) {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, access, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });
  store.set(REFRESH_TOKEN_COOKIE, refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days or 1 day
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export function getRefreshCookieName() {
  return REFRESH_TOKEN_COOKIE;
}
