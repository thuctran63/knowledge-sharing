export const revalidate = 60;

import Link from "next/link";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post/post-card";
import { TrendingItem } from "@/components/post/trending-item";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";

async function getPosts() {
  try {
    const [latest, trending] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          author: { select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true, bookmarks: true } },
        },
      }),
      prisma.post.findMany({
        where: { published: true },
        orderBy: { viewCount: "desc" },
        take: 5,
        include: {
          author: { select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true, bookmarks: true } },
        },
      }),
    ]);

    return {
      latest: latest.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag), isLiked: false, isBookmarked: false })),
      trending: trending.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag), isLiked: false, isBookmarked: false })),
    };
  } catch {
    return { latest: [], trending: [] };
  }
}

export default async function HomePage() {
  const { latest, trending } = await getPosts();

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-12 md:mb-16 animate-fade-in">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            A community for curious minds
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-semibold tracking-tight leading-[1.1] text-balance">
            Share ideas
            <br />
            <span className="text-primary">that matter.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Discover insightful articles, connect with passionate writers, and
            share your knowledge with the world.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/search"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Explore articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/post/new"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium transition-all duration-200 hover:bg-muted/50 active:scale-[0.98]"
            >
              Start writing
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-semibold tracking-tight">
                Latest
              </h2>
              <Link
                href="/search?sort=latest"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {latest.length > 0 ? (
                latest.map((post, i) => (
                  <div key={post.id} style={{ animationDelay: `${300 + i * 80}ms` }} className="animate-fade-in">
                    <PostCard post={post} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">No articles published yet.</p>
                  <Link href="/post/new" className="text-sm text-primary hover:underline mt-2">
                    Be the first to write
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section
            className="animate-fade-in rounded-xl border border-border/60 bg-card/50 p-5"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold tracking-tight text-foreground">
                  Trending
                </h2>
                <p className="text-xs text-foreground/60">Most read this week</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {trending.length > 0 ? (
                trending.map((post, i) => (
                  <TrendingItem key={post.id} post={post} rank={i + 1} />
                ))
              ) : (
                <p className="text-sm text-foreground/60 text-center py-8">
                  No trending articles yet.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
