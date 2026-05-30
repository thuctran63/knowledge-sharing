export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPostListItem, postListInclude } from "@/lib/post-queries";
import { DraftCard } from "@/components/post/draft-card";
import { PublishedArticleCard } from "@/components/post/published-article-card";
import { SavedPostCard } from "@/components/post/saved-post-card";
import { LibraryTabs } from "@/components/library/library-tabs";
import { Button } from "@/components/ui/button";
import { Bookmark, FileText, PenSquare, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Library",
  description: "Your articles and saved reading list.",
};

function isEmptyDraft(post: { title: string; excerpt: string | null }) {
  const noTitle =
    !post.title.trim() || post.title.toLowerCase() === "untitled";
  return noTitle && !post.excerpt?.trim();
}

interface LibraryPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/drafts");

  const { tab } = await searchParams;
  const activeTab = tab === "saved" ? "saved" : "articles";

  if (activeTab === "saved") {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
        post: {
          OR: [{ published: true }, { authorId: user.id }],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: postListInclude(user.id),
        },
      },
    });

    const posts = bookmarks.map((b) => ({
      ...formatPostListItem(b.post),
      isBookmarked: true,
    }));

    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-2 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <h1 className="text-3xl font-heading font-semibold tracking-tight">
                Library
              </h1>
            </div>
            <p className="text-muted-foreground">
              Your articles and saved reading list.
            </p>
          </div>

          <LibraryTabs active="saved" />

          {posts.length > 0 ? (
            <div
              className="space-y-4 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              {posts.map((post) => (
                <SavedPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border animate-fade-in">
              <Bookmark
                className="h-10 w-10 text-muted-foreground/40 mb-4"
                strokeWidth={1.5}
              />
              <p className="text-muted-foreground mb-4">No saved articles yet.</p>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/search">
                  <Search className="h-4 w-4" />
                  Explore articles
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const [published, unpublished] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: user.id, published: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        updatedAt: true,
        viewCount: true,
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.findMany({
      where: { authorId: user.id, published: false },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        updatedAt: true,
      },
    }),
  ]);

  const unpublishedArticles = unpublished.filter((d) => !isEmptyDraft(d));
  const hasAny = published.length > 0 || unpublishedArticles.length > 0;

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-2 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.5} />
              <h1 className="text-3xl font-heading font-semibold tracking-tight">
                Library
              </h1>
            </div>
            <Button asChild size="sm" className="gap-1.5 shrink-0">
              <Link href="/post/new">
                <PenSquare className="h-4 w-4" />
                New article
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Your articles and saved reading list.
          </p>
        </div>

        <LibraryTabs active="articles" />

        {hasAny ? (
          <div
            className="space-y-10 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {published.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Published ({published.length})
                </h2>
                {published.map((post) => (
                  <PublishedArticleCard key={post.id} post={post} />
                ))}
              </section>
            )}

            {unpublishedArticles.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Unpublished ({unpublishedArticles.length})
                </h2>
                {unpublishedArticles.map((post) => (
                  <DraftCard key={post.id} post={post} />
                ))}
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border animate-fade-in">
            <FileText
              className="h-10 w-10 text-muted-foreground/40 mb-4"
              strokeWidth={1.5}
            />
            <p className="text-muted-foreground mb-4">No articles yet.</p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/post/new">
                <PenSquare className="h-4 w-4" />
                Start writing
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
