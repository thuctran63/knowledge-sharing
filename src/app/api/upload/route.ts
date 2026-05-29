import { NextResponse } from "next/server";

/**
 * Post images are uploaded via POST /api/posts/{postId}/images when saving.
 * Avatars are uploaded via PATCH /api/users/{id}.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct upload is disabled. Use post save to upload images, or update your avatar from profile.",
    },
    { status: 410 }
  );
}
