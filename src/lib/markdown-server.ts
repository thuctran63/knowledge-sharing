import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import {
  rehypeApplyMarkdownClasses,
  rehypeDemoteH1,
  rehypeWrapTables,
} from "@/lib/rehype-markdown-styles";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeDemoteH1)
  .use(rehypeSlug)
  .use(rehypeHighlight)
  .use(rehypeWrapTables)
  .use(rehypeApplyMarkdownClasses)
  .use(rehypeStringify);

export async function markdownToHtml(content: string): Promise<string> {
  const result = await processor.process(content);
  return String(result);
}
