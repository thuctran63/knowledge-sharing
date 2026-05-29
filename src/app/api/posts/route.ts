import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "latest";
    const currentUserId = searchParams.get("userId");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { published: true };

    if (tag) {
      where.tags = {
        some: { tag: { name: tag } },
      };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "trending") {
      orderBy = { viewCount: "desc" };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              bio: true,
              createdAt: true,
            },
          },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { comments: true, likes: true, bookmarks: true },
          },
          likes: currentUserId
            ? { where: { userId: currentUserId } }
            : false,
          bookmarks: currentUserId
            ? { where: { userId: currentUserId } }
            : false,
        },
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
      isLiked: Array.isArray(post.likes) ? post.likes.length > 0 : false,
      isBookmarked: Array.isArray(post.bookmarks)
        ? post.bookmarks.length > 0
        : false,
      likes: undefined,
      bookmarks: undefined,
    }));

    return NextResponse.json(
      {
        data: formattedPosts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        headers:
          currentUserId
            ? {}
            : { "Cache-Control": "public, max-age=60, s-maxage=120" },
      }
    );
  } catch (error) {
    console.error("[POSTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slug, content, excerpt, published, tags } =
      await req.json();

    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const existingSlug = await prisma.post.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        published: published ?? false,
        authorId: user.id,
        tags: {
          create: await Promise.all(
            (tags || []).map(async (name: string) => {
              const tag = await prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
              });
              return { tagId: tag.id };
            })
          ),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(
      {
        ...post,
        tags: post.tags.map((pt) => pt.tag),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POSTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
