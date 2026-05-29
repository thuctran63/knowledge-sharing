import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/** Skip Next.js link prefetch — not a real visit */
export async function isPrefetchRequest() {
  const h = await headers();
  return (
    h.get("next-router-prefetch") === "1" ||
    h.get("purpose") === "prefetch"
  );
}

/** +1 view on server when a published post is opened (no extra client API). */
export async function recordPostView(postId: string, published: boolean) {
  if (!published) return null;
  if (await isPrefetchRequest()) return null;

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });

  return updated.viewCount;
}
