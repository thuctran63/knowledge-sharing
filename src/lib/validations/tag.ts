import { z } from "zod";

export const listTagsQuerySchema = z.object({
  q: z.string().max(100).default(""),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
