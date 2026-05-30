import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  notificationInclude,
  formatNotificationMessage,
  getNotificationHref,
} from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "1";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10) || 20,
      50
    );

    const where = {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: notificationInclude,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        commentId: n.commentId,
        message: formatNotificationMessage(
          n.type,
          n.actor?.name,
          n.post?.title
        ),
        href: getNotificationHref(n),
        actor: n.actor,
        post: n.post,
      })),
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });

      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          id: { in: body.ids },
        },
        data: { read: true },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: user.id, read: false },
      });

      return NextResponse.json({ success: true, unreadCount });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
