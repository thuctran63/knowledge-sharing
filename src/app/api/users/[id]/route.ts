import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
      },
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
          _count: {
            select: { comments: true, likes: true },
          },
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
        },
      }),
      prisma.post.count({
        where: { authorId: params.id, published: true },
      }),
      prisma.like.count({
        where: { post: { authorId: params.id } },
      }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }));

    return NextResponse.json({
      user,
      posts: formattedPosts,
      stats: {
        totalPosts,
        totalLikes,
      },
    });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
