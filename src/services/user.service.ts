import { prisma } from "@/lib/db";
import {
  uploadUserAvatar,
  deleteFileByUrl,
  getKeyFromUrl,
} from "@/lib/r2";
import { validateImageFileOrNormalize, MAX_AVATAR_SIZE } from "@/lib/image-upload";
import { ServiceError } from "@/lib/service-error";

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  bio: true,
  createdAt: true,
} as const;

export async function getUserProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new ServiceError("User not found", 404, "NOT_FOUND");
  }

  const [posts, totalPosts, totalLikes] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: id, published: true },
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
        author: { select: userSelect },
      },
    }),
    prisma.post.count({ where: { authorId: id, published: true } }),
    prisma.like.count({ where: { post: { authorId: id } } }),
  ]);

  const formattedPosts = posts.map((post) => ({
    ...post,
    tags: post.tags.map((pt) => pt.tag),
  }));

  return {
    user,
    posts: formattedPosts,
    stats: { totalPosts, totalLikes },
  };
}

export async function updateUserProfile(
  userId: string,
  input: { bio?: string | null; avatar?: File | null }
) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (!existing) {
    throw new ServiceError("User not found", 404, "NOT_FOUND");
  }

  const updateData: Record<string, string> = {};
  const oldImageUrl = existing.image ?? null;

  if (input.bio !== undefined && input.bio !== null) {
    updateData.bio = input.bio;
  }

  if (input.avatar) {
    const prepared = validateImageFileOrNormalize(input.avatar, MAX_AVATAR_SIZE);
    if ("error" in prepared) {
      throw new ServiceError(prepared.error, 400, "VALIDATION_ERROR");
    }

    const result = await uploadUserAvatar(prepared.file, userId);
    updateData.image = result.url;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userSelect,
  });

  if (input.avatar && oldImageUrl && oldImageUrl !== updated.image) {
    const oldKey = getKeyFromUrl(oldImageUrl);
    if (oldKey?.startsWith(`avatars/${userId}/`)) {
      try {
        await deleteFileByUrl(oldImageUrl);
      } catch {
        const { queueR2Deletion } = await import("@/services/upload.service");
        await queueR2Deletion(oldKey).catch(() => undefined);
      }
    }
  }

  return updated;
}
