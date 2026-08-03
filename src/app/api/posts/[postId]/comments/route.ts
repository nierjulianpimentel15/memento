import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership } from '@/lib/permissions';
import { createCommentSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const membership = await getMembership(session.userId, post.groupId);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse({ ...body, postId: params.postId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid comment.' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId: params.postId,
      authorId: session.userId,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    },
    include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  });

  if (post.authorId !== session.userId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        groupId: post.groupId,
        type: 'COMMENT_ADDED',
        message: 'Someone commented on your post.',
        link: `/groups/${post.groupId}/gallery?post=${post.id}`,
      },
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
