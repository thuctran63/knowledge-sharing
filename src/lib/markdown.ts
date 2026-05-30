import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { markdownComponents } from "@/components/post/markdown-components";

export function renderMarkdown(content: string) {
  return React.createElement(ReactMarkdown, {
    children: content,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight, rehypeSlug],
    components: markdownComponents,
  });
}
