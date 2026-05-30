import { PostCardSkeleton } from "@/components/post/post-card-skeleton";

export default function SavedLoading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-72 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
