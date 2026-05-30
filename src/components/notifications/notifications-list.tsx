"use client";

import { NotificationRow } from "@/components/notifications/notification-row";
import { groupNotificationsByTime } from "@/lib/notification-groups";
import type { SerializedNotification } from "@/lib/notifications";

interface NotificationsListProps {
  notifications: SerializedNotification[];
  onMarkRead?: (id: string) => void;
}

export function NotificationsList({
  notifications,
  onMarkRead,
}: NotificationsListProps) {
  const groups = groupNotificationsByTime(notifications);

  return (
    <div className="divide-y divide-border/60">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-0 z-10 bg-background/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {group.label}
          </h2>
          <div className="divide-y divide-border/40">
            {group.items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
