import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  cleanupOrphanPostImages,
  deletePostImages,
} from "@/lib/r2";
import { notifyFollowersOfNewPost } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
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
          select: { comments: true, likes: true, bookmarks: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    });
  } catch (error) {
    console.error("[POST_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, slug, content, excerpt, published, tags } =
      await req.json();

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (published !== undefined) updateData.published = published;

    if (tags !== undefined) {
      const tagData = await Promise.all(
        tags.map(async (name: string) => {
          const tag = await prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          });
          return { postId: id, tagId: tag.id };
        })
      );
      await prisma.$transaction([
        prisma.postTag.deleteMany({ where: { postId: id } }),
        prisma.postTag.createMany({ data: tagData }),
      ]);
    }

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
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

    if (published === true && !post.published) {
      await notifyFollowersOfNewPost(user.id, id);
    }

    if (content !== undefined && content !== post.content) {
      await cleanupOrphanPostImages(id, content, post.content);
    }

    return NextResponse.json({
      ...updated,
      tags: updated.tags.map((pt) => pt.tag),
    });
  } catch (error) {
    console.error("[POST_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    try {
      await deletePostImages(id);
    } catch (deleteError) {
      console.error("[POST_DELETE] Failed to delete R2 images:", deleteError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
