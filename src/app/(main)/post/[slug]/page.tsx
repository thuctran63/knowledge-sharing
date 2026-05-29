export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LikeButton } from "@/components/like/like-button";
import { BookmarkButton } from "@/components/bookmark/bookmark-button";
import { CommentList } from "@/components/comment/comment-list";
import { formatDate, readingTime } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { Clock, Eye, Heart, MessageCircle, Bookmark } from "lucide-react";
import "highlight.js/styles/github-dark.css";

interface PostPageProps {
  params: { slug: string };
}

async function getPost(slug: string, userId?: string | null) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
        },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
        likes: userId ? { where: { userId } } : false,
        bookmarks: userId ? { where: { userId } } : false,
      },
    });

    if (!post) return null;
    if (!post.published && post.authorId !== userId) return null;

    return {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
      isLiked: post.likes ? (post.likes as unknown[]).length > 0 : false,
      isBookmarked: post.bookmarks ? (post.bookmarks as unknown[]).length > 0 : false,
      likes: undefined,
      bookmarks: undefined,
    };
  } catch {
    return null;
  }
}

async function getComments(postId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return comments;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true },
  });

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: "article",
    },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const user = await getCurrentUser();
  const post = await getPost(params.slug, user?.id);
  const comments = await getComments(post?.id || "");

  if (!post) notFound();

  return (
    <article className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 animate-fade-in">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag: { id: string; name: string }) => (
                <Link key={tag.id} href={`/tag/${tag.name}`}>
                  <Badge variant="default" className="text-xs font-normal">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold tracking-tight leading-[1.1] text-balance">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <Link
              href={`/profile/${post.author.id}`}
              className="flex items-center gap-3 group"
            >
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback>
                  {post.author.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {post.author.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                {readingTime(post.content)} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" strokeWidth={1.5} />
                {post.viewCount}
              </span>
            </div>
          </div>
        </header>

        <div className="prose-custom max-w-none animate-fade-in" style={{ animationDelay: "150ms" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="flex items-center gap-4 mt-10 py-6 border-y border-border animate-fade-in" style={{ animationDelay: "200ms" }}>
          <LikeButton
            postId={post.id}
            initialLikes={post._count.likes}
            initialLiked={post.isLiked}
          />
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
            {post._count.comments}
          </span>
          <BookmarkButton
            postId={post.id}
            initialBookmarked={post.isBookmarked}
          />
        </div>

        <section className="mt-10 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <CommentList comments={comments} postId={post.id} />
        </section>
      </div>
    </article>
  );
}
