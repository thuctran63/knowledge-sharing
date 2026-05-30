"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user/user-avatar";
import { timeAgo, cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  message: string;
  href: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
};

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) return;

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore poll errors
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;

    void fetchNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session?.user, fetchNotifications]);

  useEffect(() => {
    if (open && session?.user) {
      setLoading(true);
      void fetchNotifications().finally(() => setLoading(false));
    }
  }, [open, session?.user, fetchNotifications]);

  if (status === "loading" || !session?.user) return null;

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

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notification.id] }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markingAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[min(60dvh,420px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  href={notification.href}
                  onClick={() => void handleOpenNotification(notification)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-none px-4 py-3 focus:bg-muted/50",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <UserAvatar
                    src={notification.actor?.image}
                    name={notification.actor?.name}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                Showing your latest notifications
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
