import { prisma } from '@/lib/prisma';
import type { GroupRole } from '@prisma/client';

export async function getMembership(userId: string, groupId: string) {
  return prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

export function canManageGroup(role: GroupRole | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canDeleteGroup(role: GroupRole | undefined): boolean {
  return role === 'OWNER';
}

/** Only the post's author, or a group admin/owner, may delete/edit a post. */
export function canModifyPost(role: GroupRole | undefined, isAuthor: boolean): boolean {
  return isAuthor || canManageGroup(role);
}
