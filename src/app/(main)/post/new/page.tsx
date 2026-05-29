import type { Metadata } from "next";
import { PostEditor } from "@/components/post/post-editor";

export const metadata: Metadata = {
  title: "Write a new post",
  description: "Share your knowledge with the community.",
};

export default function NewPostPage() {
  return <PostEditor variant="new" />;
}
