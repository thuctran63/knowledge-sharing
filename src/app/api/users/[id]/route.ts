import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { getUserProfile, updateUserProfile } from "@/services/user.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getUserProfile(id);
    return NextResponse.json(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.id !== id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    const bioEntry = formData.get("bio");
    const bio = typeof bioEntry === "string" ? bioEntry : undefined;

    const updated = await updateUserProfile(user.id, {
      ...(bio !== undefined ? { bio } : {}),
      avatar: file && file.size > 0 ? file : null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
