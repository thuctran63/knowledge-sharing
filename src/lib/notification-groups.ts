import type { SerializedNotification } from "@/lib/notifications";

export type NotificationTimeGroup = "today" | "yesterday" | "this_week" | "earlier";

export const NOTIFICATION_GROUP_ORDER: NotificationTimeGroup[] = [
  "today",
  "yesterday",
  "this_week",
  "earlier",
];

export const NOTIFICATION_GROUP_LABELS: Record<NotificationTimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "Last 7 days",
  earlier: "Earlier",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getNotificationTimeGroup(
  createdAt: string | Date
): NotificationTimeGroup {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  if (date >= weekAgo) return "this_week";
  return "earlier";
}

export function groupNotificationsByTime(notifications: SerializedNotification[]) {
  const groups: Record<NotificationTimeGroup, SerializedNotification[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    earlier: [],
  };

  for (const n of notifications) {
    groups[getNotificationTimeGroup(n.createdAt)].push(n);
  }

  return NOTIFICATION_GROUP_ORDER.filter((key) => groups[key].length > 0).map(
    (key) => ({
      key,
      label: NOTIFICATION_GROUP_LABELS[key],
      items: groups[key],
    })
  );
}
