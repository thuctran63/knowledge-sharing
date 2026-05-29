import Link from "next/link";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import type { PostCardData } from "@/types";

interface TrendingItemProps {
  post: PostCardData;
  rank: number;
}

export function TrendingItem({ post, rank }: TrendingItemProps) {
  return (
    <Link href={`/post/${post.slug}`} className="block group">
      <article className="flex gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold tabular-nums text-primary ring-1 ring-primary/20"
          aria-hidden
        >
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 min-w-0">
            <UserAvatar
              src={post.author.image}
              name={post.author.name}
              size="xs"
              className="shrink-0"
            />
            <span className="truncate text-xs font-medium text-foreground/80">
              {post.author.name}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-foreground/70">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-primary/80" strokeWidth={2} />
              {post.viewCount.toLocaleString()} views
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-primary/80" strokeWidth={2} />
              {post._count.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle
                className="h-3.5 w-3.5 text-primary/80"
                strokeWidth={2}
              />
              {post._count.comments}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
