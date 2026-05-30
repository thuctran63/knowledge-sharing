import Link from "next/link";
import { Clock, ExternalLink, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteDraftButton } from "@/components/post/delete-draft-button";
import { timeAgo, readingTime } from "@/lib/utils";

interface PublishedArticleCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    updatedAt: Date;
    viewCount: number;
    _count: { likes: number; comments: number };
  };
}

export function PublishedArticleCard({ post }: PublishedArticleCardProps) {
  const title =
    post.title.trim() && post.title.toLowerCase() !== "untitled"
      ? post.title
      : "Untitled";

  return (
    <article className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-colors hover:border-primary/20">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Badge className="text-[11px] font-normal">Published</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={1.5} />
            Updated {timeAgo(post.updatedAt)}
          </span>
          <span className="text-xs text-muted-foreground">
            · {post.viewCount} views · {post._count.likes} likes
          </span>
        </div>
        <h3 className="font-heading font-semibold tracking-tight truncate">
          {title}
        </h3>
        {post.excerpt ? (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {post.excerpt}
          </p>
        ) : post.content.trim() ? (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {post.content
              .replace(/!\[[^\]]*\]\([^)]+\)/g, "[image]")
              .slice(0, 120)}
          </p>
        ) : null}
        {post.content.trim() && (
          <p className="mt-2 text-xs text-muted-foreground">
            {readingTime(post.content)} min read · {post._count.comments}{" "}
            comments
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/post/${post.slug}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href={`/edit/${post.slug}`}>
            <PenLine className="h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        <DeleteDraftButton
          postId={post.id}
          postTitle={post.title}
          mode="published"
          redirectTo="/drafts"
          variant="ghost"
        />
      </div>
    </article>
  );
}
