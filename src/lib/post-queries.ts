import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordPostView } from "@/lib/post-views";

export const postAuthorSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  bio: true,
  createdAt: true,
} as const;

export function postListInclude(userId?: string | null) {
  return {
    author: { select: postAuthorSelect },
    tags: { include: { tag: true } },
    _count: {
      select: { comments: true, likes: true, bookmarks: true },
    },
    likes: userId ? { where: { userId } } : false,
    bookmarks: userId ? { where: { userId } } : false,
  } satisfies Prisma.PostInclude;
}

type PostListRow = Prisma.PostGetPayload<{
  include: ReturnType<typeof postListInclude>;
}>;

export function formatPostListItem(post: PostListRow) {
  return {
    ...post,
    tags: post.tags.map((pt) => pt.tag),
    isLiked: Array.isArray(post.likes) ? post.likes.length > 0 : false,
    isBookmarked: Array.isArray(post.bookmarks)
      ? post.bookmarks.length > 0
      : false,
    likes: undefined,
    bookmarks: undefined,
  };
}

export const POSTS_PAGE_SIZE = 10;

/** Slice `limit+1` rows and return cursor for the next page. */
export function sliceWithCursor<T extends { id: string }>(
  rows: T[],
  limit: number
): { items: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
  };
}

/** Raw post row — deduped per slug within one RSC request. */
export const getPostBySlug = cache(async (slug: string) => {
  try {
    return await prisma.post.findUnique({
      where: { slug },
      include: postListInclude(null),
    });
  } catch {
    return null;
  }
});

export type PostForPage = NonNullable<
  Awaited<ReturnType<typeof getPostForPage>>
>;

/** Enriched post for detail page (likes, follow, view count). */
export async function getPostForPage(
  slug: string,
  userId?: string | null
) {
  try {
    const post = userId
      ? await prisma.post.findUnique({
          where: { slug },
          include: postListInclude(userId),
        })
      : await getPostBySlug(slug);

    if (!post) return null;
    if (!post.published && post.authorId !== userId) return null;

    const newViewCount = await recordPostView(
      post.id,
      post.published,
      userId
    );

    let isFollowingAuthor = false;
    let authorFollowerCount = 0;

    if (userId && userId !== post.authorId) {
      const [follow, followerCount] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: post.authorId,
            },
          },
        }),
        prisma.follow.count({ where: { followingId: post.authorId } }),
      ]);
      isFollowingAuthor = !!follow;
      authorFollowerCount = followerCount;
    } else if (userId !== post.authorId) {
      authorFollowerCount = await prisma.follow.count({
        where: { followingId: post.authorId },
      });
    }

    return {
      ...post,
      viewCount: newViewCount ?? post.viewCount,
      tags: post.tags.map((pt) => pt.tag),
      isLiked: Array.isArray(post.likes) ? post.likes.length > 0 : false,
      isBookmarked: Array.isArray(post.bookmarks) ? post.bookmarks.length > 0 : false,
      isFollowingAuthor,
      authorFollowerCount,
      likes: undefined,
      bookmarks: undefined,
    };
  } catch {
    return null;
  }
}
