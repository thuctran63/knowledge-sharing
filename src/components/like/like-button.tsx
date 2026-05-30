"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
}

type LikeState = { liked: boolean; count: number };

export function LikeButton({
  postId,
  initialLikes,
  initialLiked,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const { state, toggle, isPending } = useOptimisticToggle<LikeState>({
    initial: { liked: initialLiked, count: initialLikes },
    getNext: (current) => ({
      liked: !current.liked,
      count: current.count + (current.liked ? -1 : 1),
    }),
    persist: async (previous) => {
      const res = await fetch("/api/likes", {
        method: previous.liked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Like failed");
      return {
        liked: !previous.liked,
        count: previous.count + (previous.liked ? -1 : 1),
      };
    },
    errorMessage: "Could not update like. Please try again.",
  });

  const handleClick = () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "default",
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
        state.liked
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-400",
        "disabled:opacity-50"
      )}
      aria-label={state.liked ? "Unlike" : "Like"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-200",
          state.liked && "fill-current scale-110"
        )}
        strokeWidth={state.liked ? 2 : 1.5}
      />
      <span>{state.count}</span>
    </button>
  );
}
