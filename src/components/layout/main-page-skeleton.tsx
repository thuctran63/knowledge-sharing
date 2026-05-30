import { Skeleton } from "@/components/ui/skeleton";
import { PostCardSkeleton } from "@/components/post/post-card-skeleton";
import { MainAppPage } from "@/components/layout/main-app-page";

/** Inline skeleton for (main) routes — header/footer stay visible */
export function MainPageSkeleton() {
  return (
    <MainAppPage>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
        <aside className="rounded-xl border border-border/50 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-none" />
          ))}
        </aside>
      </div>
    </MainAppPage>
  );
}
