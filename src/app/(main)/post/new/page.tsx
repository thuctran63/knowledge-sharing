import type { Metadata } from "next";
import { PostEditor } from "@/components/post/post-editor";

export const metadata: Metadata = {
  title: "Write a new post",
  description: "Share your knowledge with the community.",
};

export default function NewPostPage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-heading font-semibold tracking-tight">
            Write a new article
          </h1>
          <p className="mt-2 text-muted-foreground">
            Share your knowledge, insights, and ideas with the community.
          </p>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <PostEditor />
        </div>
      </div>
    </div>
  );
}
