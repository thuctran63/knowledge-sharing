export const revalidate = 3600;

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { UserAvatar } from "@/components/user/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/like/like-button";
import { BookmarkButton } from "@/components/bookmark/bookmark-button";
import { ShareButton } from "@/components/post/share-button";
import { CommentList } from "@/components/comment/comment-list";
import { ArticleWithToc } from "@/components/post/article-with-toc";
import { RelatedPosts } from "@/components/post/related-posts";
import { formatDate, readingTime } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { recordPostView } from "@/lib/post-views";
import { getRelatedPosts } from "@/lib/related-posts";
import { getSiteUrl } from "@/lib/site-url";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { DeleteDraftButton } from "@/components/post/delete-draft-button";
import { markdownComponents } from "@/components/post/markdown-components";
import { FollowButton } from "@/components/user/follow-button";
import { Clock, Eye, MessageCircle, PenLine } from "lucide-react";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

function extractFirstImageUrl(content: string): string | undefined {
  const match = content.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
  return match?.[1];
}

async function getPost(slug: string, userId?: string | null) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
        likes: userId ? { where: { userId } } : false,
        bookmarks: userId ? { where: { userId } } : false,
      },
    });

    if (!post) return null;
    if (!post.published && post.authorId !== userId) return null;

    const newViewCount = await recordPostView(
      post.id,
      post.published,
      userId
    );

    let isFollowingAuthor = false;
    let authorFollowerCount = 0;

    if (userId && userId !== post.authorId) {
      const [follow, followerCount] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: post.authorId,
            },
          },
        }),
        prisma.follow.count({ where: { followingId: post.authorId } }),
      ]);
      isFollowingAuthor = !!follow;
      authorFollowerCount = followerCount;
    } else if (userId !== post.authorId) {
      authorFollowerCount = await prisma.follow.count({
        where: { followingId: post.authorId },
      });
    }

    return {
      ...post,
      viewCount: newViewCount ?? post.viewCount,
      tags: post.tags.map((pt) => pt.tag),
      isLiked: post.likes ? (post.likes as unknown[]).length > 0 : false,
      isBookmarked: post.bookmarks
        ? (post.bookmarks as unknown[]).length > 0
        : false,
      isFollowingAuthor,
      authorFollowerCount,
      likes: undefined,
      bookmarks: undefined,
    };
  } catch {
    return null;
  }
}

async function getComments(postId: string) {
  try {
    return await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      content: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  if (!post) return { title: "Post not found" };

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/post/${slug}`;
  const description = post.excerpt?.trim() || post.title;
  const image = extractFirstImageUrl(post.content);

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: post.published ? undefined : { index: false, follow: false },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const post = await getPost(slug, user?.id);

  if (!post) notFound();

  const [comments, relatedPosts] = await Promise.all([
    getComments(post.id),
    getRelatedPosts(
      post.id,
      post.authorId,
      post.tags.map((t) => t.id),
      user?.id
    ),
  ]);

  const isAuthor = user?.id === post.authorId;
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/post/${post.slug}`;
  const description = post.excerpt?.trim() || post.title;
  const imageUrl = extractFirstImageUrl(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name || "Anonymous",
      url: `${siteUrl}/profile/${post.author.id}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Knowledge",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
  };

  const relatedTitle =
    post.tags.length > 0 ? "Related articles" : "More from this author";

  return (
    <article className="container max-w-7xl py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full">
        {post.published && isAuthor && (
          <div className="mb-6 flex flex-wrap items-center justify-end gap-2 animate-fade-in">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href={`/edit/${post.slug}`}>
                <PenLine className="h-3.5 w-3.5" />
                Edit article
              </Link>
            </Button>
            <DeleteDraftButton
              postId={post.id}
              postTitle={post.title}
              mode="published"
              redirectTo="/drafts"
              variant="outline"
            />
          </div>
        )}

        {!post.published && isAuthor && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Unpublished</Badge>
              <p className="text-sm text-muted-foreground">
                Only you can see this — not published yet.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/edit/${post.slug}`}>
                  <PenLine className="h-3.5 w-3.5" />
                  Continue editing
                </Link>
              </Button>
              <DeleteDraftButton
                postId={post.id}
                postTitle={post.title}
                redirectTo="/drafts"
                variant="outline"
              />
            </div>
          </div>
        )}

        <ArticleWithToc
          header={
            <header className="mb-8 md:mb-10 animate-fade-in">
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

              <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-heading font-semibold tracking-tight leading-snug">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/profile/${post.author.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 group"
                  >
                    <UserAvatar
                      src={post.author.image}
                      name={post.author.name}
                      size="md"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                        {post.author.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </Link>

                  <FollowButton
                    userId={post.author.id}
                    initialFollowing={post.isFollowingAuthor}
                    initialFollowerCount={post.authorFollowerCount}
                    className="shrink-0"
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground md:shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {readingTime(post.content)} min read
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {post.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </header>
          }
          footer={
            <>
              <div
                className="mt-10 flex items-center justify-between gap-4 border-y border-border py-6 animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <LikeButton
                    postId={post.id}
                    initialLikes={post._count.likes}
                    initialLiked={post.isLiked}
                  />
                  <span className="inline-flex h-9 items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    {post._count.comments}
                  </span>
                  <BookmarkButton
                    postId={post.id}
                    initialBookmarked={post.isBookmarked}
                  />
                </div>
                <ShareButton
                  title={post.title}
                  url={postUrl}
                  className="shrink-0"
                />
              </div>

              <RelatedPosts posts={relatedPosts} title={relatedTitle} />

              <section
                className="mt-10 animate-fade-in"
                style={{ animationDelay: "250ms" }}
              >
                <CommentList comments={comments} postId={post.id} />
              </section>
            </>
          }
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
            components={markdownComponents}
          >
            {post.content}
          </ReactMarkdown>
        </ArticleWithToc>
      </div>
    </article>
  );
}
