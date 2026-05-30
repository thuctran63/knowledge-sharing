import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { uploadPostImageForUser } from "@/services/upload.service";
import { validateImageFile } from "@/lib/image-upload";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return apiError("Post not found", 404, "NOT_FOUND");
    }

    if (post.authorId !== user.id) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", 400, "VALIDATION_ERROR");
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return apiError(validationError, 400, "VALIDATION_ERROR");
    }

    const result = await uploadPostImageForUser(file, postId);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
