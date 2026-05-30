import { z } from "zod";

export const discardPostSchema = z.object({
  urls: z.array(z.string().min(1)).default([]),
  deletePost: z.boolean().default(false),
});
