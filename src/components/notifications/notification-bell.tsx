"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await fetch("/api/notifications?limit=1");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;

    void fetchUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session?.user, fetchUnreadCount]);

  if (status === "loading" || !session?.user) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn("relative", unreadCount > 0 && "text-primary")}
    >
      <Link href="/notifications" aria-label="Notifications">
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
