import { z } from 'zod';

// ─── Provider Enum ─────────────────────────────────────────────────────
export const ProviderEnum = z.enum(['claude', 'codex', 'gemini', 'antigravity']);

// ─── Daily Entry Schema ────────────────────────────────────────────────
export const DailyEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .refine((d) => {
      const parsed = new Date(d + 'T00:00:00Z');
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    }, 'Date must be valid and not in the future'),
  provider: ProviderEnum,
  cost_usd: z.number().nonnegative('Cost must be non-negative').max(100_000, 'Cost seems unreasonably high'),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cache_creation_tokens: z.number().int().nonnegative().optional().default(0),
  cache_read_tokens: z.number().int().nonnegative().optional().default(0),
  models: z.array(z.string().max(100)).max(20).default([]),
  raw_data: z.record(z.unknown()).optional(),
});

// ─── Submit Request Schema ─────────────────────────────────────────────
export const SubmitRequestSchema = z.object({
  entries: z.array(DailyEntrySchema).min(1, 'At least one entry required').max(90, 'Max 90 entries per request'),
  source: z.enum(['cli', 'web']),
  hash: z.string().optional(),
});

// ─── Comment Schema ────────────────────────────────────────────────────
export const CommentSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long (max 1000 chars)'),
});

// ─── Follow Schema ─────────────────────────────────────────────────────
export const FollowSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
});

// ─── Kudos Schema ──────────────────────────────────────────────────────
export const KudosSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
});

// ─── Post Update Schema ────────────────────────────────────────────────
export const PostUpdateSchema = z.object({
  title: z.string().max(280).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  images: z.array(z.string().url()).max(4).optional(),
  is_published: z.boolean().optional(),
});

// ─── Profile Update Schema ─────────────────────────────────────────────
export const ProfileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .optional(),
  display_name: z.string().max(50).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  timezone: z.string().max(50).optional(),
  is_public: z.boolean().optional(),
  default_ai_provider: ProviderEnum.optional(),
});

// ─── CLI Auth Code Schema ──────────────────────────────────────────────
export const CLIVerifySchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
});

// ─── Caption Request Schema ────────────────────────────────────────────
export const CaptionRequestSchema = z.object({
  stats: z.object({
    cost_usd: z.number().optional(),
    total_tokens: z.number().optional(),
    providers: z.array(z.string()).optional(),
    date: z.string().optional(),
  }),
  imageUrls: z.array(z.string().url()).max(4).optional(),
  preferredProvider: z.string().optional(),
});

// ─── Delete Comment Schema ─────────────────────────────────────────────
export const DeleteCommentSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID'),
});

// ─── Type exports ──────────────────────────────────────────────────────
export type DailyEntry = z.infer<typeof DailyEntrySchema>;
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Follow = z.infer<typeof FollowSchema>;
export type Kudos = z.infer<typeof KudosSchema>;
export type PostUpdate = z.infer<typeof PostUpdateSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type CaptionRequest = z.infer<typeof CaptionRequestSchema>;
