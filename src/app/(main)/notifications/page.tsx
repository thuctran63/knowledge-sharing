export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchNotificationsPage } from "@/lib/notifications";
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your activity and updates from the community.",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/notifications");

  const data = await fetchNotificationsPage(user.id, 1);

  return (
    <div className="container py-6 md:py-10">
      <NotificationsPageContent
        initialNotifications={data.notifications}
        initialUnreadCount={data.unreadCount}
        initialHasMore={data.hasMore}
        initialPage={data.page}
      />
    </div>
  );
}
