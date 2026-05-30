import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existing) {
      return NextResponse.json({ message: "Already liked" });
    }

    await prisma.like.create({
      data: { userId: user.id, postId },
    });

    await createNotification({
      userId: post.authorId,
      type: "POST_LIKE",
      actorId: user.id,
      postId: post.id,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[LIKE_POST]", error);
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();

    await prisma.like.deleteMany({
      where: { userId: user.id, postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LIKE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to unlike post" },
      { status: 500 }
    );
  }
}
