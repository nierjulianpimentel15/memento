import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { commentId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (comment.authorId !== session.userId) {
    return NextResponse.json({ error: 'You can only edit your own comments.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text || text.length > 1000) {
    return NextResponse.json({ error: 'Comment must be between 1 and 1000 characters.' }, { status: 400 });
  }

  const updated = await prisma.comment.update({
    where: { id: params.commentId },
    data: { body: text, editedAt: new Date() },
  });
  return NextResponse.json({ comment: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { commentId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (comment.authorId !== session.userId) {
    return NextResponse.json({ error: 'You can only delete your own comments.' }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ ok: true });
}
