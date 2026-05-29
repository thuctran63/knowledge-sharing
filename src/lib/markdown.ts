import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";

export function renderMarkdown(content: string) {
  return React.createElement(ReactMarkdown, {
    children: content,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight, rehypeSlug],
    components: {
      pre: ({ children, ...props }) =>
        React.createElement("pre", { ...props, className: "not-procode" }, children),
      img: ({ src, alt, ...props }) =>
        React.createElement("img", {
          ...props,
          src,
          alt,
          className: "rounded-lg w-full my-8",
          loading: "lazy",
        }),
    },
  });
}
