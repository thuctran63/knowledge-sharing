"use client";

import Link from "next/link";
import {
  Bell,
  FileText,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { timeAgo, cn } from "@/lib/utils";
import type { SerializedNotification } from "@/lib/notifications";

function notificationIcon(type: string) {
  switch (type) {
    case "POST_LIKE":
      return Heart;
    case "COMMENT_REPLY":
      return MessageCircle;
    case "NEW_FOLLOWER":
      return UserPlus;
    case "NEW_POST":
      return FileText;
    default:
      return Bell;
  }
}

function notificationAction(type: string) {
  switch (type) {
    case "POST_LIKE":
      return "liked your post";
    case "COMMENT_REPLY":
      return "replied to your comment";
    case "NEW_FOLLOWER":
      return "started following you";
    case "NEW_POST":
      return "published a new article";
    default:
      return "sent you a notification";
  }
}

interface NotificationRowProps {
  notification: SerializedNotification;
  onNavigate?: () => void;
  onMarkRead?: (id: string) => void;
}

export function NotificationRow({
  notification,
  onNavigate,
  onMarkRead,
}: NotificationRowProps) {
  const Icon = notificationIcon(notification.type);
  const actorName = notification.actor?.name || "Someone";

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead?.(notification.id);
    }
    onNavigate?.();
  };

  return (
    <Link
      href={notification.href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="relative shrink-0">
        <UserAvatar
          src={notification.actor?.image}
          name={notification.actor?.name}
          size="md"
        />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-foreground">{actorName}</span>{" "}
          <span className="text-foreground/90">
            {notificationAction(notification.type)}
          </span>
        </p>
        {notification.post?.title && notification.type !== "NEW_FOLLOWER" && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {notification.post.title}
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
      )}
    </Link>
  );
}
