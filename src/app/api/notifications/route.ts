import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import {
  listNotificationsQuerySchema,
  patchNotificationsSchema,
} from "@/lib/validations/notification";
import {
  listNotifications,
  markNotificationsRead,
} from "@/services/notification.service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(req.url);
    const parsed = listNotificationsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await listNotifications(user.id, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      unreadOnly: parsed.data.unread,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = patchNotificationsSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    if ("markAllRead" in body.data) {
      const unreadCount = await markNotificationsRead(user.id);
      return NextResponse.json({ success: true, unreadCount });
    }

    const unreadCount = await markNotificationsRead(user.id, body.data.ids);
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
