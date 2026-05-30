import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import {
  createCommentSchema,
  deleteCommentSchema,
  updateCommentSchema,
} from "@/lib/validations/comment";
import {
  createComment,
  deleteComment,
  updateComment,
} from "@/services/comment.service";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = createCommentSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const comment = await createComment(user.id, body.data);
    return NextResponse.json(comment, { status: 201 });
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

    const body = updateCommentSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const updated = await updateComment(
      body.data.id,
      user.id,
      body.data.content
    );
    return NextResponse.json(updated);
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

    const body = deleteCommentSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    await deleteComment(body.data.id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
