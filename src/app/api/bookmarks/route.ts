import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import { postIdBodySchema } from "@/lib/validations/common";
import {
  addBookmark,
  listBookmarks,
  removeBookmark,
} from "@/services/bookmark.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const posts = await listBookmarks(user.id);
    return NextResponse.json(posts);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = postIdBodySchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const result = await addBookmark(user.id, body.data.postId);
    return NextResponse.json(result, {
      status: result.alreadyBookmarked ? 200 : 201,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = postIdBodySchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const result = await removeBookmark(user.id, body.data.postId);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
