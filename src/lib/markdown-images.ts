/** Markdown image URLs: ![alt](url) */
export function extractMarkdownImageUrls(content: string): string[] {
  const urls: string[] = [];
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}
