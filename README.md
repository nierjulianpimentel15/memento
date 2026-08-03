# Memento — Private Photo Sharing for Small Groups

A minimal, premium, Instagram-inspired platform for close friends and family
to privately share and relive memories together. Monochrome, dark-mode-only,
built with Next.js App Router, TypeScript, Prisma/PostgreSQL, and Sharp.

## What's here

- **Auth**: register, login, logout, "remember me", forgot/reset password —
  Argon2 password hashing, JWT access + refresh tokens in HTTP-only cookies.
- **Groups**: create, invite links/codes, join, member roles (owner / admin /
  member), promote/demote, transfer ownership, leave, delete.
- **Posts & uploads**: multi-image upload, Sharp-generated thumbnails and
  web-optimized versions, captions, location, date.
- **Gallery**: Pinterest-style masonry grid, infinite scroll, lightbox with
  keyboard nav, zoom, fullscreen, image details, original download.
- **Memories**: automatic month/year timeline grouping.
- **Comments & reactions**: nested replies, edit/delete, heart/smile/fire.
- **Notifications**: uploads, comments, invites, new members.
- **Search**: by caption, uploader, date range.
- **Security**: rate limiting, RBAC, input validation (Zod), secure cookies,
  security headers, file-type/size validation.
- **Storage**: swappable backend — ships with a working local-disk driver so
  it runs with zero external accounts; Cloudinary and Supabase drivers are
  stubbed and ready for you to wire up with real credentials.

## What's intentionally left as an extension point

Being upfront about scope, since this was a large spec:

- **Cloudinary / Supabase Storage**: the driver interface and stub
  implementations are in `src/lib/storage/`, but they aren't wired to a live
  account — I don't have credentials to test against. Install the relevant
  SDK, fill in the marked `throw` statements, set `STORAGE_DRIVER` in `.env`.
- **Named-event memories** ("Christmas", "Graduation"): the timeline groups
  by month/year automatically; grouping by *named* events would need either
  an `eventTag` field uploaders set, or an NLP pass over captions. The
  `Post` model and API are structured so this is a small addition later.
- **Email delivery** for password reset: the reset link is logged to the
  server console instead of emailed (no SMTP/Resend/Postmark account
  configured). Swap the `console.info` in
  `src/app/api/auth/forgot-password/route.ts` for a real provider.
- **Redis-backed rate limiting**: `src/lib/rate-limit.ts` is in-memory by
  default (fine for a single instance); swap in an `ioredis` store for
  multi-instance deployments.
- Test coverage is a solid starting suite (Vitest for validation/permissions/
  rate-limiting, Playwright for the auth flow), not exhaustive coverage of
  every route.

## Getting started (local, without Docker)

```bash
cp .env.example .env
# Edit .env — at minimum set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to long
# random strings, and point DATABASE_URL at a Postgres instance.

npm install
npm run prisma:migrate     # creates tables
npm run prisma:seed        # optional: sample users + group + invite code
npm run dev                # http://localhost:3000
```

Seeded accounts (if you ran the seed script):

| Email             | Password    |
|-------------------|-------------|
| alice@example.com | Password123 |
| bob@example.com   | Password123 |

Seeded invite code: `WELCOME01`

## Getting started (Docker)

```bash
cp .env.example .env
# fill in JWT secrets at minimum

docker compose up --build
# then, in another terminal, run migrations against the containerized db:
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

The app will be available at http://localhost:3000. Uploaded images persist
in the `uploads_data` Docker volume; Postgres data in `db_data`.

## Switching image storage to Cloudinary or Supabase

1. Install the SDK: `npm install cloudinary` or `npm install @supabase/supabase-js`.
2. Fill in the corresponding env vars in `.env` (see `.env.example`).
3. Implement the upload/delete calls in `src/lib/storage/cloudinary.ts` or
   `src/lib/storage/supabase.ts` (the shape is already there — just replace
   the `throw new Error(...)` stub bodies with the actual SDK calls).
4. Set `STORAGE_DRIVER=cloudinary` (or `supabase`) in `.env`.

No other code needs to change — every route only talks to the
`StorageDriver` interface.

## Testing

```bash
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright end-to-end (starts the dev server itself)
```

## Project structure

```
src/
  app/
    (auth)/            # login, register, forgot/reset password
    (dashboard)/        # groups list, gallery, memories, settings
    api/                 # route handlers (REST-style, grouped by resource)
  components/
    ui/                 # Button, Input, Card — shared primitives
    layout/             # Sidebar, bottom nav, header
    gallery/            # Masonry grid, lightbox
    posts/               # Upload dialog, comments, reactions
  lib/
    storage/            # swappable storage backend (local/cloudinary/supabase)
    validation/          # Zod schemas
    auth.ts, prisma.ts, permissions.ts, rate-limit.ts, images.ts
  types/
prisma/
  schema.prisma
  seed.ts
tests/
  unit/                 # Vitest
  e2e/                   # Playwright
```

## Notes on scale

Designed for the stated 10–100 users / thousands of images range: cursor
pagination on the gallery and memories feeds, Sharp-generated
thumbnails to keep payloads small, and no premature sharding/caching
complexity. Redis is wired as optional — add it when you actually need it.
