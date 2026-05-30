import { NextResponse } from "next/server";
import { handleRouteError, validationError } from "@/lib/api-error";
import { listTagsQuerySchema } from "@/lib/validations/tag";
import { listTags } from "@/services/tag.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listTagsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const q = parsed.data.q.trim();
    const limit =
      parsed.data.limit ?? (q ? 50 : 10);

    const tags = await listTags(q, limit);

    return NextResponse.json(tags, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=120" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
