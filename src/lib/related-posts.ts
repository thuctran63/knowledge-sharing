import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { formatPostListItem, postListInclude } from "@/lib/post-queries";

async function fetchRelatedPosts(
  postId: string,
  authorId: string,
  tagIds: string[],
  userId?: string | null
) {
  const include = postListInclude(userId);

  const moreFromAuthor = async () => {
    const posts = await prisma.post.findMany({
      where: { published: true, authorId, id: { not: postId } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include,
    });
    return posts.map(formatPostListItem);
  };

  if (tagIds.length === 0) {
    return moreFromAuthor();
  }

  const candidates = await prisma.post.findMany({
    where: {
      published: true,
      id: { not: postId },
      tags: { some: { tagId: { in: tagIds } } },
    },
    include,
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const tagIdSet = new Set(tagIds);
  const ranked = candidates
    .map((post) => ({
      post,
      overlap: post.tags.filter((t) => tagIdSet.has(t.tag.id)).length,
    }))
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return b.post.createdAt.getTime() - a.post.createdAt.getTime();
    })
    .slice(0, 4)
    .map(({ post }) => formatPostListItem(post));

  if (ranked.length > 0) return ranked;
  return moreFromAuthor();
}

export async function getRelatedPosts(
  postId: string,
  authorId: string,
  tagIds: string[],
  userId?: string | null
) {
  const cached = unstable_cache(
    () => fetchRelatedPosts(postId, authorId, tagIds, userId),
    [`related-posts-${postId}-${userId ?? "guest"}`],
    { revalidate: 3600, tags: [`related-${postId}`] }
  );
  return cached();
}
