import { prisma } from "@/lib/db";
import {
  deleteFileByUrl,
  deletePostImages,
  getKeyFromUrl,
  postImagesPrefix,
} from "@/lib/r2";
import { queueR2Deletion } from "@/services/upload.service";
import { ServiceError } from "@/lib/service-error";
import type { z } from "zod";
import type { discardPostSchema } from "@/lib/validations/discard";

type DiscardInput = z.infer<typeof discardPostSchema>;

export async function discardPostChanges(
  userId: string,
  postId: string,
  input: DiscardInput
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, published: true },
  });

  if (!post) {
    throw new ServiceError("Post not found", 404, "NOT_FOUND");
  }

  if (post.authorId !== userId) {
    throw new ServiceError("Forbidden", 403, "FORBIDDEN");
  }

  const prefix = postImagesPrefix(postId);

  for (const url of input.urls) {
    const key = getKeyFromUrl(url);
    if (key?.startsWith(prefix)) {
      try {
        await deleteFileByUrl(url);
      } catch {
        await queueR2Deletion(key).catch(() => undefined);
      }
    }
  }

  if (input.deletePost) {
    if (post.published) {
      throw new ServiceError(
        "Cannot discard a published post",
        400,
        "VALIDATION_ERROR"
      );
    }

    try {
      await deletePostImages(postId);
    } catch {
      await queueR2Deletion(prefix).catch(() => undefined);
    }

    await prisma.post.delete({ where: { id: postId } });
  }

  return { success: true };
}
