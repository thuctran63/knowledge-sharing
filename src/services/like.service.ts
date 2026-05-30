import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { ServiceError } from "@/lib/service-error";

export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });

  if (!post) {
    throw new ServiceError("Post not found", 404, "NOT_FOUND");
  }

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    return { success: true, alreadyLiked: true };
  }

  await prisma.like.create({
    data: { userId, postId },
  });

  await createNotification({
    userId: post.authorId,
    type: "POST_LIKE",
    actorId: userId,
    postId: post.id,
  });

  return { success: true, alreadyLiked: false };
}

export async function unlikePost(userId: string, postId: string) {
  await prisma.like.deleteMany({
    where: { userId, postId },
  });

  return { success: true };
}
