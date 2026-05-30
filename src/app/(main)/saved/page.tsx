export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPostListItem, postListInclude } from "@/lib/post-queries";
import { SavedPostCard } from "@/components/post/saved-post-card";
import { Button } from "@/components/ui/button";
import { Bookmark, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Saved articles",
  description: "Articles you bookmarked to read later.",
};

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/saved");

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
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-3xl font-heading font-semibold tracking-tight">
              Saved articles
            </h1>
          </div>
          <p className="text-muted-foreground">
            Articles you saved to read later.
          </p>
        </div>

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
