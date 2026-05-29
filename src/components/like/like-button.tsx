"use client";

import { useState, useRef } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
}

export function LikeButton({
  postId,
  initialLikes,
  initialLiked,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const pendingRef = useRef(false);

  const handleToggle = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "default",
      });
      return;
    }

    if (pendingRef.current) return;
    pendingRef.current = true;

    setLoading(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const res = await fetch("/api/likes", {
        method: liked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoading(false);
      pendingRef.current = false;
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition-all duration-200",
        liked
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-400",
        "disabled:opacity-50"
      )}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-200",
          liked && "fill-current scale-110"
        )}
        strokeWidth={liked ? 2 : 1.5}
      />
      <span>{likeCount}</span>
    </button>
  );
}
