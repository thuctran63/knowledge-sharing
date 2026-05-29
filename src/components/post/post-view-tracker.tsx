"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface PostViewTrackerProps {
  postId: string;
  published: boolean;
  initialCount: number;
}

export function PostViewTracker({
  postId,
  published,
  initialCount,
}: PostViewTrackerProps) {
  const [viewCount, setViewCount] = useState(initialCount);

  useEffect(() => {
    if (!published) return;

    let cancelled = false;

    void fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.viewCount != null) {
          setViewCount(data.viewCount);
        }
      })
      .catch(() => {
        if (!cancelled) setViewCount((c) => c + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, published]);

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="h-4 w-4" strokeWidth={1.5} />
      {viewCount.toLocaleString()}
    </span>
  );
}
