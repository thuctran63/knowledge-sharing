import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPostListItem, postListInclude } from "@/lib/post-queries";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "latest";
    const tag = searchParams.get("tag")?.trim() || "";

    if (!q.trim()) {
      return NextResponse.json({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    }

    const user = await getCurrentUser();
    const query = q.trim();
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { excerpt: { contains: query, mode: "insensitive" as const } },
        { content: { contains: query, mode: "insensitive" as const } },
        { author: { name: { contains: query, mode: "insensitive" as const } } },
        {
          tags: {
            some: {
              tag: { name: { contains: query, mode: "insensitive" as const } },
            },
          },
        },
      ],
    };

    if (tag) {
      where.tags = {
        some: { tag: { name: tag } },
      };
    }

    const orderBy =
      sort === "trending"
        ? [{ viewCount: "desc" as const }, { createdAt: "desc" as const }]
        : { createdAt: "desc" as const };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: postListInclude(user?.id),
      }),
      prisma.post.count({ where }),
    ]);

    let formattedPosts = posts.map(formatPostListItem);

    if (sort === "latest") {
      const lowerQ = query.toLowerCase();
      formattedPosts = [...formattedPosts].sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(lowerQ) ? 0 : 1;
        const bTitle = b.title.toLowerCase().includes(lowerQ) ? 0 : 1;
        if (aTitle !== bTitle) return aTitle - bTitle;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    return NextResponse.json(
      {
        data: formattedPosts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        headers: user
          ? {}
          : { "Cache-Control": "public, max-age=60, s-maxage=120" },
      }
    );
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
