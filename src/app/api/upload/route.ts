import { apiError } from "@/lib/api-error";

/**
 * Post images: POST /api/posts/{postId}/images
 * Avatars: PATCH /api/users/{id}
 */
export async function POST() {
  return apiError(
    "Direct upload is disabled. Use post save to upload images, or update your avatar from profile.",
    410
  );
}
