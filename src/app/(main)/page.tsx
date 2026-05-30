export const revalidate = 60;

import Link from "next/link";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  formatPostListItem,
  postListInclude,
  POSTS_PAGE_SIZE,
  sliceWithCursor,
} from "@/lib/post-queries";
import { HomeFeedTabs } from "@/components/home/home-feed-tabs";
import { HomeFeedTabsHeader } from "@/components/home/home-feed-tabs-header";
import {
  TrendingPanel,
  TrendingPanelHeader,
} from "@/components/home/trending-panel";
import { MainAppPage } from "@/components/layout/main-app-page";
import { ArrowRight, Sparkles } from "lucide-react";

const getLatestPosts = cache(async function getLatestPosts(userId?: string | null) {
  const include = postListInclude(userId);

  const latestRows = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: POSTS_PAGE_SIZE + 1,
    include,
  });

  const { items, nextCursor } = sliceWithCursor(latestRows, POSTS_PAGE_SIZE);

  return {
    posts: items.map(formatPostListItem),
    nextCursor,
  };
});

const getFollowingPosts = cache(async function getFollowingPosts(userId: string) {
  const include = postListInclude(userId);

  const rows = await prisma.post.findMany({
    where: {
      published: true,
      author: {
        followers: {
          some: { followerId: userId }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: POSTS_PAGE_SIZE + 1,
    include,
  });

  const { items, nextCursor } = sliceWithCursor(rows, POSTS_PAGE_SIZE);

  return {
    posts: items.map(formatPostListItem),
    nextCursor,
  };
});

const getTrendingPosts = cache(async function getTrendingPosts(userId?: string | null) {
  const include = postListInclude(userId);

  const trendingRows = await prisma.post.findMany({
    where: { published: true },
    orderBy: { viewCount: "desc" },
    take: 5,
    include,
  });

  return trendingRows.map(formatPostListItem);
});

interface HomePageProps {
  searchParams: Promise<{ feed?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();
  const { feed: feedParam } = await searchParams;
  const feed = feedParam === "following" ? "following" : "latest";

  const [latest, following, trending] = await Promise.all([
    getLatestPosts(user?.id),
    user
      ? getFollowingPosts(user.id)
      : Promise.resolve({ posts: [], nextCursor: null as string | null }),
    getTrendingPosts(user?.id),
  ]);

  return (
    <MainAppPage>
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

      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6 animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        <div className="lg:col-span-2">
          <HomeFeedTabsHeader feed={feed} />
        </div>
        <div className="hidden lg:block">
          <TrendingPanelHeader />
        </div>

        <div className="lg:col-span-2">
          <HomeFeedTabs
            feed={feed}
            latestPosts={latest.posts}
            latestNextCursor={latest.nextCursor}
            followingPosts={following.posts}
            followingNextCursor={following.nextCursor}
            userId={user?.id ?? null}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <TrendingPanel posts={trending} />
        </aside>
      </div>
    </MainAppPage>
  );
}
