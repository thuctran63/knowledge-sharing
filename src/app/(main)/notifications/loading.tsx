import { Skeleton } from "@/components/ui/skeleton";
import { MainAppPage } from "@/components/layout/main-app-page";

export default function NotificationsLoading() {
  return (
    <MainAppPage>
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </MainAppPage>
  );
}
