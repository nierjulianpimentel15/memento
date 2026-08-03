import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership } from '@/lib/permissions';
import { withImageUrlsList } from '@/lib/image-urls';

/**
 * Groups a group's posts into a "Month YYYY" timeline (e.g. "Summer 2026",
 * shown simply as "August 2026" here — named-event detection like
 * "Christmas"/"Graduation" would need either user-tagged events or an NLP
 * pass over captions, which is intentionally left as an extension point:
 * add an `eventTag` column on Post and let uploaders label a post's occasion).
 */
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await getMembership(session.userId, params.groupId);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const posts = await prisma.post.findMany({
    where: { groupId: params.groupId },
    orderBy: { takenAt: 'desc' },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const groups = new Map<string, { label: string; year: number; month: number; posts: typeof posts }>();
  for (const post of posts) {
    const d = post.takenAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!groups.has(key)) {
      groups.set(key, { label, year: d.getFullYear(), month: d.getMonth(), posts: [] });
    }
    groups.get(key)!.posts.push({ ...post, images: withImageUrlsList(post.images) } as (typeof posts)[number]);
  }

  const timeline = Array.from(groups.values()).sort((a, b) => b.year - a.year || b.month - a.month);
  return NextResponse.json({ timeline });
}
