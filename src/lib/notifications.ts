import { prisma } from "@/lib/db";
import { postAuthorSelect } from "@/lib/post-queries";

export type NotificationType =
  | "COMMENT_REPLY"
  | "POST_LIKE"
  | "NEW_FOLLOWER"
  | "NEW_POST";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  postId?: string | null;
  commentId?: string | null;
}

export async function createNotification({
  userId,
  type,
  actorId,
  postId,
  commentId,
}: CreateNotificationInput) {
  if (actorId && actorId === userId) return;

  await prisma.notification.create({
    data: {
      userId,
      type,
      actorId: actorId ?? null,
      postId: postId ?? null,
      commentId: commentId ?? null,
    },
  });
}

export async function notifyFollowersOfNewPost(
  authorId: string,
  postId: string
) {
  const followers = await prisma.follow.findMany({
    where: { followingId: authorId },
    select: { followerId: true },
  });

  await Promise.all(
    followers.map((follow) =>
      createNotification({
        userId: follow.followerId,
        type: "NEW_POST",
        actorId: authorId,
        postId,
      })
    )
  );
}

export const notificationInclude = {
  actor: { select: postAuthorSelect },
  post: { select: { id: true, slug: true, title: true } },
} as const;

export function formatNotificationMessage(
  type: string,
  actorName?: string | null,
  postTitle?: string | null
): string {
  const name = actorName || "Someone";

  switch (type) {
    case "COMMENT_REPLY":
      return `${name} replied to your comment`;
    case "POST_LIKE":
      return `${name} liked your post`;
    case "NEW_FOLLOWER":
      return `${name} started following you`;
    case "NEW_POST":
      return postTitle
        ? `${name} published "${postTitle}"`
        : `${name} published a new article`;
    default:
      return "You have a new notification";
  }
}

export function getNotificationHref(notification: {
  type: string;
  actorId: string | null;
  post: { slug: string } | null;
  commentId: string | null;
}): string {
  switch (notification.type) {
    case "NEW_FOLLOWER":
      return notification.actorId
        ? `/profile/${notification.actorId}`
        : "/";
    case "POST_LIKE":
    case "NEW_POST":
      return notification.post ? `/post/${notification.post.slug}` : "/";
    case "COMMENT_REPLY":
      return notification.post
        ? `/post/${notification.post.slug}${
            notification.commentId
              ? `#comment-${notification.commentId}`
              : ""
          }`
        : "/";
    default:
      return "/";
  }
}

export type SerializedNotification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  commentId: string | null;
  href: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  post: { id: string; slug: string; title: string } | null;
};

export function serializeNotification(
  n: {
    id: string;
    type: string;
    read: boolean;
    createdAt: Date;
    commentId: string | null;
    actorId: string | null;
    actor: SerializedNotification["actor"];
    post: SerializedNotification["post"];
  }
): SerializedNotification {
  return {
    id: n.id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    commentId: n.commentId,
    href: getNotificationHref(n),
    actor: n.actor,
    post: n.post,
  };
}

export const NOTIFICATIONS_PAGE_SIZE = 30;

export async function fetchNotificationsPage(
  userId: string,
  page: number,
  limit = NOTIFICATIONS_PAGE_SIZE
) {
  const skip = (page - 1) * limit;

  const where = { userId };

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: notificationInclude,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications: rows.map(serializeNotification),
    unreadCount,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
  };
}
