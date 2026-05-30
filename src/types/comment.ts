import type { Comment } from "@prisma/client";
import type { SafeUser } from "./user";

export type CommentWithAuthor = Comment & {
  author: SafeUser;
  replies?: CommentWithAuthor[];
};
