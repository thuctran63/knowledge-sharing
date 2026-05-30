import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import { postIdBodySchema } from "@/lib/validations/common";
import { likePost, unlikePost } from "@/services/like.service";

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

    const result = await likePost(user.id, body.data.postId);
    return NextResponse.json(result, {
      status: result.alreadyLiked ? 200 : 201,
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

    const result = await unlikePost(user.id, body.data.postId);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
