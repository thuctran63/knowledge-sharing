import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().max(200).default(""),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["latest", "trending"]).default("latest"),
  tag: z.string().max(50).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
