"use client";

import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, readingTime, timeAgo } from "@/lib/utils";
import type { PostCardData } from "@/types";

interface PostCardProps {
  post: PostCardData;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <article
      className={cn(
        "group relative rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
        featured && "md:col-span-2 md:grid md:grid-cols-2 md:gap-6"
      )}
    >
      <Link href={`/post/${post.slug}`} className="block p-5">
        <div className="flex items-start justify-between gap-4">
          <div className={cn("flex-1 min-w-0", featured && "md:py-4")}>
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback className="text-[10px]">
                  {post.author.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {post.author.name}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <time className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </time>
            </div>

            <h2
              className={cn(
                "font-heading font-semibold tracking-tight text-balance group-hover:text-primary transition-colors duration-200",
                featured ? "text-2xl md:text-3xl" : "text-lg"
              )}
            >
              {post.title}
            </h2>

            {post.excerpt && (
              <p
                className={cn(
                  "mt-2 text-muted-foreground leading-relaxed text-balance",
                  featured ? "text-base" : "text-sm line-clamp-2"
                )}
              >
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1 text-xs">
                  <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {post._count.likes}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {post._count.comments}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {readingTime(post.content)} min read
              </span>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="default"
                    className="text-[11px] px-2 py-0.5 font-normal"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
