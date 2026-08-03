import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getMembership } from '@/lib/permissions';
import { reactionSchema } from '@/lib/validation/schemas';

/** Toggle: adding the same reaction twice removes it (like tapping a heart again). */
export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const membership = await getMembership(session.userId, post.groupId);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = reactionSchema.safeParse({ ...body, postId: params.postId });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 });

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId_type: { postId: params.postId, userId: session.userId, type: parsed.data.type },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ removed: true });
  }

  const reaction = await prisma.reaction.create({
    data: { postId: params.postId, userId: session.userId, type: parsed.data.type },
  });
  return NextResponse.json({ reaction }, { status: 201 });
}
