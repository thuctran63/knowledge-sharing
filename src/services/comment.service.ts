import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import type { CreateCommentInput } from "@/lib/validations/comment";
import { ServiceError } from "@/lib/service-error";

const authorSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  bio: true,
  createdAt: true,
} as const;

export async function createComment(
  authorId: string,
  input: CreateCommentInput
) {
  const { content, postId, parentId } = input;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ServiceError("Post not found", 404, "NOT_FOUND");

  let parentAuthorId: string | null = null;

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { authorId: true, postId: true },
    });
    if (!parent || parent.postId !== postId) {
      throw new ServiceError("Invalid parent comment", 400, "VALIDATION_ERROR");
    }
    parentAuthorId = parent.authorId;
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId,
      parentId: parentId ?? null,
    },
    include: { author: { select: authorSelect } },
  });

  if (parentAuthorId) {
    await createNotification({
      userId: parentAuthorId,
      type: "COMMENT_REPLY",
      actorId: authorId,
      postId,
      commentId: parentId,
    });
  }

  return comment;
}

export async function updateComment(
  commentId: string,
  authorId: string,
  content: string
) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ServiceError("Comment not found", 404, "NOT_FOUND");
  if (comment.authorId !== authorId) {
    throw new ServiceError("Forbidden", 403, "FORBIDDEN");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
}

export async function deleteComment(commentId: string, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ServiceError("Comment not found", 404, "NOT_FOUND");
  if (comment.authorId !== authorId) {
    throw new ServiceError("Forbidden", 403, "FORBIDDEN");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
