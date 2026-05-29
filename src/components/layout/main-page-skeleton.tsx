import { Skeleton } from "@/components/ui/skeleton";
import { PostCardSkeleton } from "@/components/post/post-card-skeleton";

/** Inline skeleton for (main) routes — header/footer stay visible */
export function MainPageSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <section className="mb-12 md:mb-16">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-7 w-52 rounded-full" />
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-12 w-3/4 max-w-sm" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-11 w-36 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>

        <aside className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-3">
          <div className="flex items-center gap-2 pb-4 border-b border-border/50">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </aside>
      </div>
    </div>
  );
}
