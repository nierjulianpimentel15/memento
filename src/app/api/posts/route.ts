import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership } from '@/lib/permissions';
import { withImageUrlsList } from '@/lib/image-urls';

/**
 * GET /api/posts?groupId=...&cursor=...&take=30&q=...&uploader=...&from=...&to=...
 * Cursor-based pagination for infinite scroll; `q` searches captions,
 * `uploader` filters by username, `from`/`to` filter by takenAt date range —
 * this backs both the masonry gallery and the search feature.
 */
export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const groupId = searchParams.get('groupId');
  if (!groupId) return NextResponse.json({ error: 'groupId is required.' }, { status: 400 });

  const membership = await getMembership(session.userId, groupId);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const take = Math.min(Number(searchParams.get('take') ?? 30), 60);
  const cursor = searchParams.get('cursor') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const uploader = searchParams.get('uploader') ?? undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const posts = await prisma.post.findMany({
    where: {
      groupId,
      caption: q ? { contains: q, mode: 'insensitive' } : undefined,
      author: uploader ? { username: uploader } : undefined,
      takenAt: from || to ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } : undefined,
    },
    orderBy: { takenAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      images: { orderBy: { order: 'asc' } },
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const hasMore = posts.length > take;
  const page = hasMore ? posts.slice(0, take) : posts;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  const withUrls = page.map((post: (typeof page)[number]) => ({ ...post, images: withImageUrlsList(post.images) }));

  return NextResponse.json({ posts: withUrls, nextCursor });
}
