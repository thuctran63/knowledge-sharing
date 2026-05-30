import { prisma } from "@/lib/db";
import { formatPostListItem, postListInclude } from "@/lib/post-queries";
import { ServiceError } from "@/lib/service-error";

export async function listBookmarks(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      post: {
        include: postListInclude(userId),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return bookmarks.map((b) => ({
    ...formatPostListItem(b.post),
    isBookmarked: true,
  }));
}

export async function addBookmark(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new ServiceError("Post not found", 404, "NOT_FOUND");
  }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    return { success: true, alreadyBookmarked: true };
  }

  await prisma.bookmark.create({
    data: { userId, postId },
  });

  return { success: true, alreadyBookmarked: false };
}

export async function removeBookmark(userId: string, postId: string) {
  await prisma.bookmark.deleteMany({
    where: { userId, postId },
  });

  return { success: true };
}
