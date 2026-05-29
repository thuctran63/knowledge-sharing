import type { User, Post, Tag, Comment, Like, Bookmark } from "@prisma/client";

export type SafeUser = Pick<
  User,
  "id" | "name" | "email" | "image" | "bio" | "createdAt"
>;

export type PostWithAuthor = Post & {
  author: SafeUser;
  tags: (Tag & {})[];
  _count?: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
  likes?: Like[];
  bookmarks?: Bookmark[];
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export type CommentWithAuthor = Comment & {
  author: SafeUser;
  replies?: CommentWithAuthor[];
};

export type PostCardData = Post & {
  author: SafeUser;
  tags: Tag[];
  _count: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export interface SearchResult {
  posts: PostCardData[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
