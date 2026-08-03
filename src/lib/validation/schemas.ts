import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(24, 'Username must be at most 24 characters.')
    .regex(/^[a-z0-9_]+$/i, 'Username can only contain letters, numbers, and underscores.'),
  displayName: z.string().trim().min(1, 'Display name is required.').max(60),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters.')
    .max(200)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(10)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required.').max(80),
  description: z.string().trim().max(500).optional().default(''),
});

export const joinGroupSchema = z.object({
  code: z.string().trim().min(1, 'Invite code is required.'),
});

export const createPostSchema = z.object({
  groupId: z.string().min(1),
  caption: z.string().trim().max(2000).optional().default(''),
  location: z.string().trim().max(200).optional(),
  takenAt: z.string().datetime().optional(),
});

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().trim().min(1, 'Comment cannot be empty.').max(1000),
  parentId: z.string().min(1).optional(),
});

export const reactionSchema = z.object({
  postId: z.string().min(1),
  type: z.enum(['HEART', 'SMILE', 'FIRE']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
