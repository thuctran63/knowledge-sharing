import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleRouteError, validationError } from "@/lib/api-error";
import { searchQuerySchema } from "@/lib/validations/search";
import { searchPosts } from "@/services/search.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = searchQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const user = await getCurrentUser();
    const result = await searchPosts(parsed.data, user?.id);

    return NextResponse.json(result, {
      headers: user
        ? {}
        : { "Cache-Control": "public, max-age=60, s-maxage=120" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
