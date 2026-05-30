"use client";

import { useState } from "react";
import { PostCard } from "@/components/post/post-card";
import { BookmarkButton } from "@/components/bookmark/bookmark-button";
import type { PostCardData } from "@/types";

interface SavedPostCardProps {
  post: PostCardData;
}

export function SavedPostCard({ post }: SavedPostCardProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative group/saved">
      <PostCard post={{ ...post, isBookmarked: true }} backFrom="library" />
      <div className="absolute top-4 right-4 z-10 rounded-lg bg-background/90 p-1 shadow-sm backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover/saved:opacity-100 transition-opacity">
        <BookmarkButton
          postId={post.id}
          initialBookmarked
          onChange={(bookmarked) => {
            if (!bookmarked) setVisible(false);
          }}
        />
      </div>
    </div>
  );
}
