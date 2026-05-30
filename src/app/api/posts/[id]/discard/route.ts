import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import { discardPostSchema } from "@/lib/validations/discard";
import { discardPostChanges } from "@/services/post-discard.service";

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

    const body = discardPostSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const result = await discardPostChanges(user.id, postId, body.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
