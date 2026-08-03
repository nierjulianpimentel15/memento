import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getCurrentSession } from '@/lib/auth';
import { getMembership } from '@/lib/permissions';
import { checkUploadRateLimit } from '@/lib/rate-limit';
import { processUpload, ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from '@/lib/images';
import { getStorageDriver } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { createPostSchema } from '@/lib/validation/schemas';

/**
 * Accepts multipart/form-data: one or more `files`, plus `groupId`, `caption`,
 * `location` fields. Creates a Post with its Image rows in one transaction.
 * Each file is validated (allow-list MIME type, size cap, real image
 * decode via Sharp) before anything is persisted.
 */
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = checkUploadRateLimit(session.userId);
  if (!allowed) return NextResponse.json({ error: 'Upload rate limit exceeded. Try again shortly.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });

  const meta = createPostSchema.safeParse({
    groupId: form.get('groupId'),
    caption: form.get('caption') ?? '',
    location: form.get('location') || undefined,
  });
  if (!meta.success) {
    return NextResponse.json({ error: meta.error.issues[0]?.message ?? 'Invalid post metadata.' }, { status: 400 });
  }

  const membership = await getMembership(session.userId, meta.data.groupId);
  if (!membership) return NextResponse.json({ error: 'You are not a member of this group.' }, { status: 403 });

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
  if (files.length > 20) return NextResponse.json({ error: 'A post can contain at most 20 images.' }, { status: 400 });

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 415 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `${file.name} exceeds the 25MB size limit.` }, { status: 413 });
    }
  }

  const storage = getStorageDriver();
  const folder = `groups/${meta.data.groupId}/${new Date().getFullYear()}`;

  const imageRecords = [];
  for (const [index, file] of files.entries()) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let processed;
    try {
      processed = await processUpload(buffer);
    } catch (err) {
      return NextResponse.json({ error: `${file.name}: ${(err as Error).message}` }, { status: 422 });
    }

    const id = nanoid(12);
    const [original, web, thumb] = await Promise.all([
      storage.upload(processed.original, { folder, filename: `${id}-original.jpg`, mimeType: file.type }),
      storage.upload(processed.web, { folder, filename: `${id}-web.webp`, mimeType: 'image/webp' }),
      storage.upload(processed.thumbnail, { folder, filename: `${id}-thumb.webp`, mimeType: 'image/webp' }),
    ]);

    imageRecords.push({
      storageKey: original.key,
      webKey: web.key,
      thumbnailKey: thumb.key,
      width: processed.width,
      height: processed.height,
      bytes: buffer.byteLength,
      mimeType: file.type,
      order: index,
    });
  }

  const post = await prisma.post.create({
    data: {
      groupId: meta.data.groupId,
      authorId: session.userId,
      caption: meta.data.caption,
      location: meta.data.location,
      images: { create: imageRecords },
    },
    include: { images: true },
  });

  // Notify other group members.
  const otherMembers = await prisma.membership.findMany({
    where: { groupId: meta.data.groupId, userId: { not: session.userId } },
    select: { userId: true },
  });
  if (otherMembers.length) {
    await prisma.notification.createMany({
      data: otherMembers.map((m: { userId: string }) => ({
        userId: m.userId,
        groupId: meta.data.groupId,
        type: 'POST_UPLOADED' as const,
        message: 'New photos were added to your group.',
        link: `/groups/${meta.data.groupId}/gallery`,
      })),
    });
  }

  return NextResponse.json({ post }, { status: 201 });
}
