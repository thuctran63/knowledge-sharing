import Link from "next/link";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import type { PostCardData } from "@/types";

interface TrendingItemProps {
  post: PostCardData;
  rank: number;
}

export function TrendingItem({ post, rank }: TrendingItemProps) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="group flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
    >
      <span
        className={cn(
          "mt-0.5 w-6 shrink-0 text-center text-sm font-semibold tabular-nums",
          rank <= 3 ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        <div className="mt-2 flex items-center gap-2 min-w-0">
          <UserAvatar
            src={post.author.image}
            name={post.author.name}
            size="xs"
            className="shrink-0"
          />
          <span className="truncate text-xs text-muted-foreground">
            {post.author.name}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" strokeWidth={1.5} />
            {post.viewCount.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3 w-3" strokeWidth={1.5} />
            {post._count.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
            {post._count.comments}
          </span>
        </div>
      </div>
    </Link>
  );
}
