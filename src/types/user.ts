import type { User } from "@prisma/client";

export type SafeUser = Pick<
  User,
  "id" | "name" | "email" | "image" | "bio" | "createdAt"
>;

export type UserWithStats = SafeUser & {
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
};
