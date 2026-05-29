export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PostEditor } from "@/components/post/post-editor";

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { tags: { include: { tag: true } } },
  });

  if (!post || post.authorId !== user.id) notFound();

  const postWithTags = {
    ...post,
    tags: post.tags.map((pt) => ({ id: pt.tag.id, name: pt.tag.name })),
  };

  return <PostEditor post={postWithTags} variant="edit" />;
}
