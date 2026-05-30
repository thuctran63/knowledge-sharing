import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 10, 100) : q ? 50 : 10;

    const tags = await prisma.tag.findMany({
      where: {
        posts: {
          some: {
            post: { published: true },
          },
        },
        ...(q
          ? { name: { contains: q, mode: "insensitive" as const } }
          : {}),
      },
      include: {
        _count: {
          select: {
            posts: {
              where: { post: { published: true } },
            },
          },
        },
      },
      orderBy: {
        posts: { _count: "desc" },
      },
      take: limit,
    });

    return NextResponse.json(
      tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.posts,
      })),
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=120" } }
    );
  } catch (error) {
    console.error("[TAGS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
