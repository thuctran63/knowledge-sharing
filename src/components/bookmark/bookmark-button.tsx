"use client";

import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";

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
  const { data: session } = useSession();
  const { toast } = useToast();

  const { state, toggle, isPending } = useOptimisticToggle({
    initial: initialBookmarked,
    getNext: (current) => !current,
    persist: async (current, next) => {
      const res = await fetch("/api/bookmarks", {
        method: current ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Bookmark failed");
      onChange?.(next);
      return next;
    },
    errorMessage: "Could not update bookmark. Please try again.",
  });

  const handleClick = () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark posts.",
      });
      return;
    }
    void toggle();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 text-sm transition-all duration-200",
        state
          ? "text-primary"
          : "text-muted-foreground hover:text-primary",
        "disabled:opacity-50"
      )}
      aria-label={state ? "Remove bookmark" : "Bookmark"}
    >
      <Bookmark
        className={cn(
          "h-5 w-5 transition-all duration-200",
          state && "fill-current"
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}
