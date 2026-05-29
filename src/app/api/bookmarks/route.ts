import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        post: {
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
            _count: {
              select: { comments: true, likes: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const posts = bookmarks.map((b) => ({
      ...b.post,
      tags: b.post.tags.map((pt) => pt.tag),
      isBookmarked: true,
    }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[BOOKMARKS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
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

    const { postId } = await req.json();

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existing) {
      return NextResponse.json({ message: "Already bookmarked" });
    }

    await prisma.bookmark.create({
      data: { userId: user.id, postId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[BOOKMARK_POST]", error);
    return NextResponse.json(
      { error: "Failed to bookmark post" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();

    await prisma.bookmark.deleteMany({
      where: { userId: user.id, postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BOOKMARK_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}
