import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import { updatePostSchema } from "@/lib/validations/post";
import {
  deletePost,
  getPostById,
  updatePost,
} from "@/services/post.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPostById(id);

    if (!post) {
      return apiError("Post not found", 404, "NOT_FOUND");
    }

    return NextResponse.json(post);
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
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = updatePostSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const updated = await updatePost(id, user.id, body.data);
    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    await deletePost(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
