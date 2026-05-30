import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  unread: z
    .string()
    .optional()
    .transform((v) => v === "1"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const patchNotificationsSchema = z.union([
  z.object({ markAllRead: z.literal(true) }),
  z.object({ ids: z.array(z.string().cuid()).min(1) }),
]);
