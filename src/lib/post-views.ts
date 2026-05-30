import { createHash } from "crypto";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Skip Next.js link prefetch — not a real visit */
export async function isPrefetchRequest() {
  const h = await headers();
  return (
    h.get("next-router-prefetch") === "1" ||
    h.get("purpose") === "prefetch"
  );
}

async function getViewerKey(userId?: string | null) {
  if (userId) return `user:${userId}`;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const ua = h.get("user-agent") || "unknown";
  const hash = createHash("sha256")
    .update(`${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32);

  return `anon:${hash}`;
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Record a unique view per viewer; increment count only on first view. */
export async function recordPostView(
  postId: string,
  published: boolean,
  userId?: string | null
) {
  if (!published) return null;
  if (await isPrefetchRequest()) return null;

  const viewerKey = await getViewerKey(userId);

  try {
    await prisma.postView.create({
      data: { postId, viewerKey },
    });

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return updated.viewCount;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { viewCount: true },
      });
      return post?.viewCount ?? null;
    }

    throw error;
  }
}
