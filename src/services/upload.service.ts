import { prisma } from "@/lib/db";
import {
  deleteFile,
  deletePrefix,
  uploadPostImage,
  type UploadResult,
} from "@/lib/r2";

export async function uploadPostImageForUser(
  file: File,
  postId: string
): Promise<UploadResult> {
  return uploadPostImage(file, postId);
}

/** Queue R2 key/prefix for retry when immediate delete fails. */
export async function queueR2Deletion(r2Key: string) {
  await prisma.pendingDeletion.create({ data: { r2Key } });
}

export async function processPendingDeletions() {
  const pending = await prisma.pendingDeletion.findMany({
    where: { attempts: { lt: 3 } },
    take: 50,
  });

  let deleted = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      if (item.r2Key.endsWith("/")) {
        await deletePrefix(item.r2Key);
      } else {
        await deleteFile(item.r2Key);
      }
      await prisma.pendingDeletion.delete({ where: { id: item.id } });
      deleted++;
    } catch {
      await prisma.pendingDeletion.update({
        where: { id: item.id },
        data: { attempts: { increment: 1 } },
      });
      failed++;
    }
  }

  return { deleted, failed, processed: pending.length };
}

export async function cleanupOldPostViews() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.postView.deleteMany({
    where: { viewedAt: { lt: thirtyDaysAgo } },
  });
  return count;
}
