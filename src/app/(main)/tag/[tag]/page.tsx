export const revalidate = 300;

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  formatPostListItem,
  postListInclude,
  POSTS_PAGE_SIZE,
} from "@/lib/post-queries";
import { PostFeed } from "@/components/post/post-feed";
import { Hash } from "lucide-react";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

async function getTagPosts(tagName: string, userId?: string | null) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) return null;

    const where = {
      published: true,
      tags: { some: { tagId: tag.id } },
    };

    const [postsRows, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: POSTS_PAGE_SIZE,
        include: postListInclude(userId),
      }),
      prisma.post.count({ where }),
    ]);

    return {
      tag: tag.name,
      totalPosts,
      posts: postsRows.map(formatPostListItem),
      totalPages: Math.max(1, Math.ceil(totalPosts / POSTS_PAGE_SIZE)),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params;
  const existing = await prisma.tag.findUnique({
    where: { name: tag },
    select: { id: true },
  });
  if (!existing) return { title: "Tag not found" };
  return {
    title: `#${tag} - Articles`,
    description: `Browse articles tagged with #${tag}.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const user = await getCurrentUser();
  const data = await getTagPosts(tag, user?.id);
  if (!data) notFound();

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Hash className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight">
              {data.tag}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {data.totalPosts} article{data.totalPosts !== 1 ? "s" : ""} tagged
            with <strong>#{data.tag}</strong>
          </p>
        </div>

        <PostFeed
          initialPosts={data.posts}
          initialPage={1}
          initialTotalPages={data.totalPages}
          tag={data.tag}
          userId={user?.id ?? null}
          emptyMessage="No published articles for this tag yet."
        />
      </div>
    </div>
  );
}
