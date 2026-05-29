import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteFileByUrl,
  deletePostImages,
  getKeyFromUrl,
  postImagesPrefix,
} from "@/lib/r2";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, published: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : [];
    const deletePost = body.deletePost === true;

    const prefix = postImagesPrefix(postId);

    for (const url of urls) {
      const key = getKeyFromUrl(url);
      if (key?.startsWith(prefix)) {
        try {
          await deleteFileByUrl(url);
        } catch (e) {
          console.error("[POST_DISCARD] Failed to delete:", url, e);
        }
      }
    }

    if (deletePost) {
      if (post.published) {
        return NextResponse.json(
          { error: "Cannot discard a published post" },
          { status: 400 }
        );
      }

      try {
        await deletePostImages(postId);
      } catch (e) {
        console.error("[POST_DISCARD] Failed to delete R2 folder:", e);
      }

      await prisma.post.delete({ where: { id: postId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST_DISCARD]", error);
    return NextResponse.json(
      { error: "Failed to discard changes" },
      { status: 500 }
    );
  }
}
