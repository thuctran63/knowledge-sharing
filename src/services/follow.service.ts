import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { ServiceError } from "@/lib/service-error";

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new ServiceError("Cannot follow yourself", 400, "VALIDATION_ERROR");
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) throw new ServiceError("User not found", 404, "NOT_FOUND");

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existing) {
    return getFollowerCount(followingId);
  }

  await prisma.follow.create({
    data: { followerId, followingId },
  });

  await createNotification({
    userId: followingId,
    type: "NEW_FOLLOWER",
    actorId: followerId,
  });

  return getFollowerCount(followingId);
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });

  return getFollowerCount(followingId);
}

export async function getFollowerCount(userId: string) {
  return prisma.follow.count({ where: { followingId: userId } });
}
