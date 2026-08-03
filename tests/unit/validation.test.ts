import { describe, it, expect } from 'vitest';
import { registerSchema, createGroupSchema, createCommentSchema } from '@/lib/validation/schemas';

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'user_one',
      displayName: 'User One',
      password: 'Passw0rd123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a weak password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'user_one',
      displayName: 'User One',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid username with special characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'user one!',
      displayName: 'User One',
      password: 'Passw0rd123',
    });
    expect(result.success).toBe(false);
  });
});

describe('createGroupSchema', () => {
  it('requires a non-empty name', () => {
    const result = createGroupSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('defaults description to an empty string', () => {
    const result = createGroupSchema.safeParse({ name: 'Family' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBe('');
  });
});

describe('createCommentSchema', () => {
  it('rejects empty comment bodies', () => {
    const result = createCommentSchema.safeParse({ postId: 'p1', body: '   ' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid comment', () => {
    const result = createCommentSchema.safeParse({ postId: 'p1', body: 'Great photo!' });
    expect(result.success).toBe(true);
  });
});
