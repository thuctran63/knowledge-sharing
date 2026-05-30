"use client";

import { useState, useRef } from "react";
import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked: boolean;
  onChange?: (bookmarked: boolean) => void;
}

export function BookmarkButton({
  postId,
  initialBookmarked,
  onChange,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const pendingRef = useRef(false);

  const handleToggle = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark posts.",
      });
      return;
    }

    if (pendingRef.current) return;
    pendingRef.current = true;

    setLoading(true);
    const prev = bookmarked;
    const next = !bookmarked;
    setBookmarked(next);

    try {
      const res = await fetch("/api/bookmarks", {
        method: bookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        setBookmarked(prev);
      } else {
        onChange?.(next);
      }
    } catch {
      setBookmarked(prev);
    } finally {
      setLoading(false);
      pendingRef.current = false;
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition-all duration-200",
        bookmarked
          ? "text-primary"
          : "text-muted-foreground hover:text-primary",
        "disabled:opacity-50"
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
    >
      <Bookmark
        className={cn(
          "h-5 w-5 transition-all duration-200",
          bookmarked && "fill-current"
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}
