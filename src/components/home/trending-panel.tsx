import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { TrendingItem } from "@/components/post/trending-item";
import type { PostCardData } from "@/types";

interface TrendingPanelProps {
  posts: PostCardData[];
}

export function TrendingPanelHeader() {
  return (
    <div className="flex min-h-10 items-center gap-2">
      <TrendingUp className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
      <div className="min-w-0">
        <h2 className="text-sm font-heading font-semibold tracking-tight leading-none">
          Trending
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Most read this week
        </p>
      </div>
    </div>
  );
}

export function TrendingPanel({ posts }: TrendingPanelProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="lg:hidden flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-muted/20">
        <TrendingUp className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
        <div>
          <h2 className="text-sm font-heading font-semibold">Trending</h2>
          <p className="text-xs text-muted-foreground">Most read this week</p>
        </div>
      </div>

      {posts.length > 0 ? (
        <ol className="divide-y divide-border/50">
          {posts.map((post, i) => (
            <li key={post.id}>
              <TrendingItem post={post} rank={i + 1} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No trending articles yet.
        </p>
      )}

      {posts.length > 0 && (
        <div className="border-t border-border/50 px-4 py-2.5 bg-muted/10">
          <Link
            href="/search?sort=trending"
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            See all trending →
          </Link>
        </div>
      )}
    </section>
  );
}
