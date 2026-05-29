import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: { _count: "desc" },
      },
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
