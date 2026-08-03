import { describe, it, expect } from 'vitest';
import { canManageGroup, canDeleteGroup, canModifyPost } from '@/lib/permissions';

describe('permissions', () => {
  it('owners and admins can manage a group', () => {
    expect(canManageGroup('OWNER')).toBe(true);
    expect(canManageGroup('ADMIN')).toBe(true);
    expect(canManageGroup('MEMBER')).toBe(false);
  });

  it('only owners can delete a group', () => {
    expect(canDeleteGroup('OWNER')).toBe(true);
    expect(canDeleteGroup('ADMIN')).toBe(false);
  });

  it('a post can be modified by its author regardless of role', () => {
    expect(canModifyPost('MEMBER', true)).toBe(true);
    expect(canModifyPost('MEMBER', false)).toBe(false);
    expect(canModifyPost('ADMIN', false)).toBe(true);
  });
});
