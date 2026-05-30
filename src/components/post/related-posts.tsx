import Link from "next/link";
import { PostCard } from "@/components/post/post-card";
import type { PostCardData } from "@/types";

interface RelatedPostsProps {
  posts: PostCardData[];
  title?: string;
}

export function RelatedPosts({
  posts,
  title = "Related articles",
}: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <section className="mt-12 pt-10 border-t border-border animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold tracking-tight">
          {title}
        </h2>
        {posts[0]?.author && title === "More from this author" ? (
          <Link
            href={`/profile/${posts[0].author.id}`}
            className="text-sm text-primary hover:underline"
          >
            View profile
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
