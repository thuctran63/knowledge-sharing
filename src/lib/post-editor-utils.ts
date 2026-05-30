import { extractMarkdownImageUrls } from "@/lib/markdown-images";

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
  if (a.title !== b.title) return false;
  if (a.content.length !== b.content.length) return false;
  if (a.content !== b.content) return false;
  if (a.excerpt !== b.excerpt) return false;
  if (a.published !== b.published) return false;
  if (a.tags.length !== b.tags.length) return false;
  return a.tags.every((t, i) => t === b.tags[i]);
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
  return `draft-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 4)}`;
}

/** Update address bar to /edit/[slug] without triggering a Next.js navigation. */
export function syncDraftEditorUrl(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  const path = `/edit/${slug}`;
  if (window.location.pathname === path) return;
  window.history.replaceState(window.history.state, "", path);
}

export function urlsInSnapshot(snapshot: EditorSnapshot) {
  return new Set(extractMarkdownImageUrls(snapshot.content));
}
