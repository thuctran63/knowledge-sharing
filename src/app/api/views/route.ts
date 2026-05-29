import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.published) {
      return NextResponse.json({ viewCount: 0, skipped: true });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ success: true, viewCount: updated.viewCount });
  } catch (error) {
    console.error("[VIEW_POST]", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
