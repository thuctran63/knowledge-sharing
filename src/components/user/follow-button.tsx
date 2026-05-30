"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  initialFollowerCount?: number;
  size?: "sm" | "default";
  className?: string;
  onChange?: (following: boolean, followerCount: number) => void;
}

export function FollowButton({
  userId,
  initialFollowing,
  initialFollowerCount,
  size = "sm",
  className,
  onChange,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount ?? 0);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(false);

  if (session?.user?.id === userId) return null;

  const handleToggle = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow authors.",
      });
      return;
    }

    if (pendingRef.current) return;
    pendingRef.current = true;
    setLoading(true);

    const prevFollowing = following;
    const prevCount = followerCount;
    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setFollowerCount((c) => Math.max(0, c + (nextFollowing ? 1 : -1)));

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: nextFollowing ? "POST" : "DELETE",
      });

      if (!res.ok) {
        setFollowing(prevFollowing);
        setFollowerCount(prevCount);
        toast({
          title: "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      if (typeof data.followerCount === "number") {
        setFollowerCount(data.followerCount);
        onChange?.(nextFollowing, data.followerCount);
      } else {
        onChange?.(nextFollowing, followerCount);
      }
    } catch {
      setFollowing(prevFollowing);
      setFollowerCount(prevCount);
    } finally {
      setLoading(false);
      pendingRef.current = false;
    }
  };

  if (!session) {
    return (
      <Button asChild size={size} variant="outline" className={cn("gap-1.5", className)}>
        <Link href="/login">
          <UserPlus className="h-3.5 w-3.5" />
          Follow
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "secondary" : "default"}
      className={cn("gap-1.5", className)}
      onClick={() => void handleToggle()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
