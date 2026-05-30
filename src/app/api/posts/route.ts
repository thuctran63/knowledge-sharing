import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, handleRouteError, validationError } from "@/lib/api-error";
import {
  createPostSchema,
  listPostsQuerySchema,
} from "@/lib/validations/post";
import {
  createPost,
  listPosts,
} from "@/services/post.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listPostsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await listPosts(parsed.data);
    const currentUserId = parsed.data.userId;

    return NextResponse.json(result, {
      headers:
        currentUserId
          ? {}
          : { "Cache-Control": "public, max-age=60, s-maxage=120" },
    });
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

    const body = createPostSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const post = await createPost(user.id, body.data);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
