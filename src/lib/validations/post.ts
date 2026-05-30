import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  content: z.string().max(100_000).default(""),
  excerpt: z.string().max(500).optional().nullable(),
  published: z.boolean().optional().default(false),
  tags: z.array(z.string().min(1).max(50)).max(5).optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  tag: z.string().min(1).max(50).optional(),
  sort: z.enum(["latest", "trending"]).default("latest"),
  feed: z.enum(["following"]).optional(),
  userId: z.string().cuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
