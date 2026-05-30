"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/post/markdown-components";

/** Editor preview: GFM only — syntax highlight runs on publish (server). */
const markdownPlugins = {
  remarkPlugins: [remarkGfm],
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
