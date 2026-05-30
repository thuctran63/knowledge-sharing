import { prisma } from "@/lib/db";
import {
  createNotification,
  fetchNotificationsPage,
  notificationInclude,
  serializeNotification,
  type NotificationType,
} from "@/lib/notifications";

export { createNotification, fetchNotificationsPage, serializeNotification };

export async function listNotifications(
  userId: string,
  options: { page: number; limit: number; unreadOnly?: boolean }
) {
  const { page, limit, unreadOnly } = options;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly ? { read: false } : {}),
  };

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: notificationInclude,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  return {
    unreadCount,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
    notifications: rows.map(serializeNotification),
  };
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const where = ids?.length
    ? { userId, id: { in: ids } }
    : { userId, read: false };

  await prisma.notification.updateMany({
    where,
    data: { read: true },
  });

  return getUnreadCount(userId);
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function createTypedNotification(input: {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  postId?: string | null;
  commentId?: string | null;
}) {
  return createNotification(input);
}

export { notificationInclude };
