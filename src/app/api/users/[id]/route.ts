import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile } from "@/lib/r2";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [posts, totalPosts, totalLikes] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: params.id, published: true },
        orderBy: { createdAt: "desc" },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true } },
          author: {
            select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
          },
        },
      }),
      prisma.post.count({ where: { authorId: params.id, published: true } }),
      prisma.like.count({ where: { post: { authorId: params.id } } }),
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    const bio = formData.get("bio") as string | null;

    const updateData: Record<string, string> = {};
    let avatarKey: string | null = null;

    if (bio !== null) {
      updateData.bio = bio;
    }

    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type" },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large (max 5MB)" },
          { status: 400 }
        );
      }

      const result = await uploadFile(file, "avatars");
      updateData.image = result.url;
      avatarKey = result.key;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, image: true, bio: true, createdAt: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
