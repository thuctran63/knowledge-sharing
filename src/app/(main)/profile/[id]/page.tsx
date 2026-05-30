export const revalidate = 300;

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PostCard } from "@/components/post/post-card";
import { DraftCard } from "@/components/post/draft-card";
import { FollowButton } from "@/components/user/follow-button";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, FilePen } from "lucide-react";
import { formatDate } from "@/lib/utils";

function isEmptyDraft(post: {
  title: string;
  content: string;
  excerpt: string | null;
}) {
  const noTitle =
    !post.title.trim() || post.title.toLowerCase() === "untitled";
  return noTitle && !post.content.trim() && !post.excerpt?.trim();
}

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

async function getUserProfile(id: string, viewerId?: string | null) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
    });

    if (!user) return null;

    const isOwner = viewerId === id;

    const [posts, totalPosts, totalLikes, followerCount, isFollowing, drafts] =
      await Promise.all([
      prisma.post.findMany({
        where: { authorId: id, published: true },
        orderBy: { createdAt: "desc" },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true, bookmarks: true } },
          author: {
            select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
          },
        },
      }),
      prisma.post.count({ where: { authorId: id, published: true } }),
      prisma.like.count({ where: { post: { authorId: id } } }),
      prisma.follow.count({ where: { followingId: id } }),
      viewerId && viewerId !== id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: id,
              },
            },
          })
        : Promise.resolve(null),
      isOwner
        ? prisma.post.findMany({
            where: { authorId: id, published: false },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
              excerpt: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    return {
      user,
      posts: posts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag), isLiked: false, isBookmarked: false })),
      drafts: drafts.filter((d) => !isEmptyDraft(d)),
      stats: { totalPosts, totalLikes, followerCount },
      isFollowing: !!isFollowing,
      isOwner,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { id } = await params;
  const data = await getUserProfile(id);
  if (!data) return { title: "User not found" };
  return {
    title: `${data.user.name} - Profile`,
    description: `${data.user.name}'s profile on Knowledge.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const data = await getUserProfile(id, viewer?.id);
  if (!data) notFound();

  const { user, posts, drafts, stats, isFollowing, isOwner } = data;

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-12 animate-fade-in">
          <div className="flex flex-col items-center md:items-start gap-4">
            <AvatarUpload
              userId={user.id}
              image={user.image}
              name={user.name}
              size="large"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-heading font-semibold tracking-tight">
              {user.name}
            </h1>
            {user.bio && (
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {user.bio}
              </p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-1.5 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
              Joined {formatDate(user.createdAt)}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-heading font-semibold">
                  {stats.totalPosts}
                </p>
                <p className="text-xs text-muted-foreground">Articles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-semibold">
                  {stats.followerCount}
                </p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-semibold">
                  {stats.totalLikes}
                </p>
                <p className="text-xs text-muted-foreground">Likes received</p>
              </div>
            </div>

            {!isOwner && (
              <div className="mt-6 flex justify-center md:justify-start">
                <FollowButton
                  userId={user.id}
                  initialFollowing={isFollowing}
                  initialFollowerCount={stats.followerCount}
                />
              </div>
            )}
          </div>
        </div>

        {isOwner && drafts.length > 0 && (
          <section className="mb-12 animate-fade-in" style={{ animationDelay: "80ms" }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <FilePen className="h-5 w-5" strokeWidth={1.5} />
                <h2 className="text-xl font-heading font-semibold tracking-tight">
                  Unpublished
                </h2>
                <span className="text-sm text-muted-foreground">({drafts.length})</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/drafts">View all</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {drafts.slice(0, 3).map((draft) => (
                <DraftCard key={draft.id} post={draft} />
              ))}
            </div>
          </section>
        )}

        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5" strokeWidth={1.5} />
            <h2 className="text-xl font-heading font-semibold tracking-tight">
              Articles
            </h2>
          </div>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${150 + i * 60}ms` }}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground">No articles published yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
