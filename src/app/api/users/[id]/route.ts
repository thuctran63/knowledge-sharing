import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  uploadUserAvatar,
  deleteFileByUrl,
  getKeyFromUrl,
} from "@/lib/r2";
import { validateImageFile } from "@/lib/image-upload";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [posts, totalPosts, totalLikes] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: id, published: true },
        orderBy: { createdAt: "desc" },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true } },
          author: {
            select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
          },
        },
      }),
      prisma.post.count({ where: { authorId: id, published: true } }),
      prisma.like.count({ where: { post: { authorId: id } } }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }));

    return NextResponse.json({
      user,
      posts: formattedPosts,
      stats: { totalPosts, totalLikes },
    });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { image: true },
    });

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    const bioEntry = formData.get("bio");
    const bio = typeof bioEntry === "string" ? bioEntry : null;

    const updateData: Record<string, string> = {};
    const oldImageUrl = existing?.image ?? null;

    if (bio !== null) {
      updateData.bio = bio;
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large (max 5MB)" },
          { status: 400 }
        );
      }

      const validationError = validateImageFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const result = await uploadUserAvatar(file, id);
      updateData.image = result.url;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
    });

    if (file && oldImageUrl && oldImageUrl !== updated.image) {
      const oldKey = getKeyFromUrl(oldImageUrl);
      if (oldKey?.startsWith(`avatars/${id}/`)) {
        try {
          await deleteFileByUrl(oldImageUrl);
        } catch (deleteError) {
          console.error("[USER_PATCH] Failed to delete old avatar from R2:", deleteError);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
