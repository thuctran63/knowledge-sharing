export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PostEditor } from "@/components/post/post-editor";

interface EditPostPageProps {
  params: { slug: string };
}

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { tags: { include: { tag: true } } },
  });

  if (!post || post.authorId !== user.id) notFound();

  const postWithTags = {
    ...post,
    tags: post.tags.map((pt) => ({ id: pt.tag.id, name: pt.tag.name })),
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-heading font-semibold tracking-tight">
            Edit article
          </h1>
          <p className="mt-2 text-muted-foreground">
            Make changes to your article.
          </p>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <PostEditor post={postWithTags} />
        </div>
      </div>
    </div>
  );
}
