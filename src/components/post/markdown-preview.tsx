"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";

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
    <ReactMarkdown
      {...markdownPlugins}
      components={{
        img: ({ src, alt }) => {
          const url = typeof src === "string" ? src : "";
          if (!url.trim()) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt ?? ""}
              className="rounded-lg max-w-full h-auto my-4"
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
