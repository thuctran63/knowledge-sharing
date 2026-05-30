import type { Prisma } from "@prisma/client";

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
