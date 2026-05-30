import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetId } = await params;

    if (targetId === user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetId,
        },
      },
    });

    if (!existing) {
      await prisma.follow.create({
        data: { followerId: user.id, followingId: targetId },
      });

      await createNotification({
        userId: targetId,
        type: "NEW_FOLLOWER",
        actorId: user.id,
      });
    }

    const followerCount = await prisma.follow.count({
      where: { followingId: targetId },
    });

    return NextResponse.json({ following: true, followerCount });
  } catch (error) {
    console.error("[FOLLOW_POST]", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetId } = await params;

    await prisma.follow.deleteMany({
      where: { followerId: user.id, followingId: targetId },
    });

    const followerCount = await prisma.follow.count({
      where: { followingId: targetId },
    });

    return NextResponse.json({ following: false, followerCount });
  } catch (error) {
    console.error("[FOLLOW_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
