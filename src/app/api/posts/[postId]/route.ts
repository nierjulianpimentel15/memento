import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership, canModifyPost } from '@/lib/permissions';
import { getStorageDriver } from '@/lib/storage';
import { withImageUrlsList } from '@/lib/image-urls';

export async function GET(_req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: {
      images: { orderBy: { order: 'asc' } },
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          replies: { include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        },
      },
      reactions: { include: { user: { select: { id: true, username: true } } } },
    },
  });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const membership = await getMembership(session.userId, post.groupId);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ post: { ...post, images: withImageUrlsList(post.images) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId }, include: { images: true } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const membership = await getMembership(session.userId, post.groupId);
  if (!membership || !canModifyPost(membership.role, post.authorId === session.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const storage = getStorageDriver();
  await Promise.allSettled(
    post.images.flatMap((img: { storageKey: string; webKey: string; thumbnailKey: string }) => [
      storage.delete(img.storageKey),
      storage.delete(img.webKey),
      storage.delete(img.thumbnailKey),
    ])
  );

  await prisma.post.delete({ where: { id: params.postId } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'POST_DELETED', targetType: 'Post', targetId: params.postId },
  });

  return NextResponse.json({ ok: true });
}
