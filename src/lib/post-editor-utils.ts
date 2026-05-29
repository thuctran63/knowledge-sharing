import { extractMarkdownImageUrls } from "@/lib/r2";

export type EditorSnapshot = {
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  tags: string[];
};

export type SyncState = "saved" | "unsaved" | "saving" | "error";

export function makeSnapshot(
  title: string,
  content: string,
  excerpt: string,
  published: boolean,
  tags: string[]
): EditorSnapshot {
  return {
    title: title.trim(),
    content,
    excerpt: excerpt.trim(),
    published,
    tags: [...tags].sort(),
  };
}

export function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function hasEditorContent(
  title: string,
  content: string,
  excerpt: string,
  tags: string[]
) {
  return (
    title.trim().length > 0 ||
    content.trim().length > 0 ||
    excerpt.trim().length > 0 ||
    tags.length > 0
  );
}

export function isEmptyDraft(snapshot: EditorSnapshot) {
  const noTitle =
    !snapshot.title || snapshot.title.toLowerCase() === "untitled";
  return noTitle && !snapshot.content.trim() && !snapshot.excerpt.trim();
}

export function parseMarkdownImages(content: string) {
  const images: { alt: string; url: string }[] = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    images.push({ alt: match[1], url: match[2].trim() });
  }
  return images;
}

export function removeImageFromContent(content: string, url: string) {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content
    .replace(new RegExp(`!\\[[^\\]]*\\]\\(${escaped}\\)\\n?`, "g"), "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function draftSlug() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function urlsInSnapshot(snapshot: EditorSnapshot) {
  return new Set(extractMarkdownImageUrls(snapshot.content));
}
