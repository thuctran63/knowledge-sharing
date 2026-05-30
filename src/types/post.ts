import type { Post, Tag, Like, Bookmark } from "@prisma/client";
import type { SafeUser } from "./user";

export type PostWithAuthor = Post & {
  author: SafeUser;
  tags: Tag[];
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
