export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post/post-card";
import { Hash } from "lucide-react";

interface TagPageProps {
  params: { tag: string };
}

async function getTagPosts(tagName: string) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) return null;

    const posts = await prisma.post.findMany({
      where: {
        published: true,
        tags: { some: { tagId: tag.id } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
        },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });

    const totalPosts = await prisma.postTag.count({
      where: { tagId: tag.id },
    });

    return {
      tag: tag.name,
      totalPosts,
      posts: posts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag), isLiked: false, isBookmarked: false })),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: TagPageProps) {
  return {
    title: `#${params.tag} - Articles`,
    description: `Browse articles tagged with #${params.tag}.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const data = await getTagPosts(params.tag);
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
            {data.totalPosts} article{data.totalPosts !== 1 ? "s" : ""} tagged with <strong>#{data.tag}</strong>
          </p>
        </div>

        <div className="space-y-4">
          {data.posts.map((post, i) => (
            <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
