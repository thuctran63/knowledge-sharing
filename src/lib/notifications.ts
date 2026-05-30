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
