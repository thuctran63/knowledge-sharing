import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const postIdBodySchema = z.object({
  postId: z.string().cuid(),
});
