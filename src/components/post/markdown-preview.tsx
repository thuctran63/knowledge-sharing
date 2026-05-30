"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { markdownComponents } from "@/components/post/markdown-components";

const markdownPlugins = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeHighlight, rehypeSlug],
};

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Your article preview will appear here…
      </p>
    );
  }

  return (
    <article className="markdown-article">
      <ReactMarkdown {...markdownPlugins} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
