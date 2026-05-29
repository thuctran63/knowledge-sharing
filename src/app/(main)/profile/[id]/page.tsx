export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PostCard } from "@/components/post/post-card";
import { Calendar, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ProfilePageProps {
  params: { id: string };
}

async function getUserProfile(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
    });

    if (!user) return null;

    const [posts, totalPosts, totalLikes] = await Promise.all([
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
    ]);

    return {
      user,
      posts: posts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag), isLiked: false, isBookmarked: false })),
      stats: { totalPosts, totalLikes },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const data = await getUserProfile(params.id);
  if (!data) return { title: "User not found" };
  return {
    title: `${data.user.name} - Profile`,
    description: `${data.user.name}'s profile on Knowledge.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const data = await getUserProfile(params.id);
  if (!data) notFound();

  const { user, posts, stats } = data;

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

            <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-heading font-semibold">
                  {stats.totalPosts}
                </p>
                <p className="text-xs text-muted-foreground">Articles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-semibold">
                  {stats.totalLikes}
                </p>
                <p className="text-xs text-muted-foreground">Likes received</p>
              </div>
            </div>
          </div>
        </div>

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
