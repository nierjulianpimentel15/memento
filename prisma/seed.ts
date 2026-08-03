import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample data…');

  const passwordHash = await argon2.hash('Password123', { type: argon2.argon2id });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Rivera',
      passwordHash,
      bio: 'Keeper of the family photo archive.',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Santos',
      passwordHash,
      bio: 'Always the one taking the photo, never in it.',
    },
  });

  const group = await prisma.group.upsert({
    where: { id: 'seed-group-1' },
    update: {},
    create: {
      id: 'seed-group-1',
      name: 'The Rivera-Santos Family',
      description: 'Every trip, every holiday, every ordinary Tuesday worth remembering.',
      creatorId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.inviteCode.upsert({
    where: { code: 'WELCOME01' },
    update: {},
    create: {
      code: 'WELCOME01',
      groupId: group.id,
      createdBy: alice.id,
      maxUses: 25,
    },
  });

  const existingPosts = await prisma.post.count({ where: { groupId: group.id } });
  if (existingPosts === 0) {
    await prisma.post.create({
      data: {
        groupId: group.id,
        authorId: alice.id,
        caption: 'Welcome to Memento! This is a sample post — upload real photos to replace it.',
        takenAt: new Date(),
        images: {
          create: [
            {
              storageKey: 'seed/placeholder-original.jpg',
              webKey: 'seed/placeholder-web.jpg',
              thumbnailKey: 'seed/placeholder-thumb.jpg',
              width: 1200,
              height: 900,
              bytes: 0,
              mimeType: 'image/jpeg',
              order: 0,
            },
          ],
        },
      },
    });
  }

  console.log('Seed complete.');
  console.log('  alice@example.com / Password123');
  console.log('  bob@example.com   / Password123');
  console.log('  Invite code: WELCOME01');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
