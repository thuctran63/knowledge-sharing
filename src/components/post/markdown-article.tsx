import { markdownToHtml } from "@/lib/markdown-server";

type MarkdownArticleProps = {
  content: string;
  className?: string;
};

export async function MarkdownArticle({
  content,
  className = "",
}: MarkdownArticleProps) {
  const html = await markdownToHtml(content);

  return (
    <div
      className={`markdown-body max-w-none ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
