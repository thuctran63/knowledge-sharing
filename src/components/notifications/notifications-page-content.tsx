"use client";

import { useCallback, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsList } from "@/components/notifications/notifications-list";
import type { SerializedNotification } from "@/lib/notifications";

interface NotificationsPageContentProps {
  initialNotifications: SerializedNotification[];
  initialUnreadCount: number;
  initialHasMore: boolean;
  initialPage: number;
}

export function NotificationsPageContent({
  initialNotifications,
  initialUnreadCount,
  initialHasMore,
  initialPage,
}: NotificationsPageContentProps) {
  const [notifications, setNotifications] =
    useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }, []);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/notifications?page=${page + 1}`);
      if (!res.ok) return;

      const data = await res.json();
      const incoming = (data.notifications || []) as SerializedNotification[];

      setNotifications((prev) => {
        const ids = new Set(prev.map((n) => n.id));
        return [...prev, ...incoming.filter((n) => !ids.has(n.id))];
      });
      setPage(page + 1);
      setHasMore(data.hasMore ?? false);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" strokeWidth={1.5} />
          <h1 className="text-3xl font-heading font-semibold tracking-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={markingAll}
            onClick={() => void handleMarkAllRead()}
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <>
          <NotificationsList
            notifications={notifications}
            onMarkRead={(id) => void markRead(id)}
          />

          {hasMore && (
            <div className="flex justify-center border-t border-border/60 py-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="min-w-[140px] gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Bell
            className="h-12 w-12 text-muted-foreground/40 mb-4"
            strokeWidth={1.5}
          />
          <p className="text-muted-foreground">No notifications yet.</p>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Likes, comments, and follows will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
