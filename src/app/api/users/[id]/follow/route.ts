import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import {
  followUser,
  unfollowUser,
} from "@/services/follow.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { id: targetId } = await params;
    const followerCount = await followUser(user.id, targetId);

    return NextResponse.json({ following: true, followerCount });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { id: targetId } = await params;
    const followerCount = await unfollowUser(user.id, targetId);

    return NextResponse.json({ following: false, followerCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
