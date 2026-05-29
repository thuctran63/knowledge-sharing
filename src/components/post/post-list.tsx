"use client";

import { PostCard } from "./post-card";
import type { PostCardData } from "@/types";

interface PostListProps {
  posts: PostCardData[];
  loading?: boolean;
}

export function PostList({ posts, loading }: PostListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl border border-border/50 bg-card animate-shimmer bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%]"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-heading font-semibold mb-1">
          No articles yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Be the first to share your knowledge with the community.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
