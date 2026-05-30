import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  postId: z.string().cuid(),
  parentId: z.string().cuid().nullable().optional(),
});

export const updateCommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1).max(2000),
});

export const deleteCommentSchema = z.object({
  id: z.string().cuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
