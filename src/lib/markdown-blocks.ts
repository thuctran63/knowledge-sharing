export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt: string;
  status: "uploading" | "ready" | "error";
  /** Local blob preview while uploading */
  previewUrl?: string;
};

export type EditorBlock = ParagraphBlock | ImageBlock;

export function blockId() {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function splitParagraphs(text: string): ParagraphBlock[] {
  const trimmed = text.replace(/^\n+|\n+$/g, "");
  if (!trimmed) return [];

  return trimmed.split(/\n\n+/).map((t) => ({
    id: blockId(),
    type: "paragraph" as const,
    text: t,
  }));
}

/** Parse stored markdown into visual blocks (Medium-style). */
export function markdownToBlocks(content: string): EditorBlock[] {
  const blocks: EditorBlock[] = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    blocks.push(...splitParagraphs(content.slice(lastIndex, match.index)));
    blocks.push({
      id: blockId(),
      type: "image",
      url: match[2].trim(),
      alt: match[1],
      status: "ready",
    });
    lastIndex = match.index + match[0].length;
  }

  blocks.push(...splitParagraphs(content.slice(lastIndex)));

  if (!blocks.length) {
    return [{ id: blockId(), type: "paragraph", text: "" }];
  }

  return blocks;
}

/** Serialize blocks back to markdown for DB storage. */
export function blocksToMarkdown(blocks: EditorBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "paragraph") return block.text;
      if (block.status !== "ready" || !block.url.trim()) return "";
      return `![${block.alt}](${block.url})`;
    })
    .filter((part) => part.length > 0)
    .join("\n\n");
}

export function hasBlockContent(blocks: EditorBlock[]) {
  return blocks.some((b) => {
    if (b.type === "paragraph") return b.text.trim().length > 0;
    return b.status === "ready" && b.url.trim().length > 0;
  });
}

export function removeImageBlock(blocks: EditorBlock[], id: string) {
  const next = blocks.filter((b) => b.id !== id);
  if (!next.length) {
    return [{ id: blockId(), type: "paragraph" as const, text: "" }];
  }
  return next;
}

export function updateParagraphBlock(
  blocks: EditorBlock[],
  id: string,
  text: string
): EditorBlock[] {
  return blocks.map((b) => (b.id === id && b.type === "paragraph" ? { ...b, text } : b));
}

export function insertBlocksAfter(
  blocks: EditorBlock[],
  afterId: string | null,
  newBlocks: EditorBlock[]
): EditorBlock[] {
  if (!afterId) return [...blocks, ...newBlocks];

  const index = blocks.findIndex((b) => b.id === afterId);
  if (index === -1) return [...blocks, ...newBlocks];

  return [
    ...blocks.slice(0, index + 1),
    ...newBlocks,
    ...blocks.slice(index + 1),
  ];
}

/** Insert images and ensure a paragraph exists below them for continued typing. */
export function insertImagesWithTypingParagraph(
  blocks: EditorBlock[],
  afterId: string | null,
  imageBlocks: EditorBlock[]
): { blocks: EditorBlock[]; focusParagraphId: string } {
  const merged = insertBlocksAfter(blocks, afterId, imageBlocks);

  const anchorIndex = afterId ? blocks.findIndex((b) => b.id === afterId) : -1;
  const afterImagesIndex =
    anchorIndex === -1
      ? merged.length
      : anchorIndex + 1 + imageBlocks.length;

  const nextBlock = merged[afterImagesIndex];
  if (nextBlock?.type === "paragraph") {
    return { blocks: merged, focusParagraphId: nextBlock.id };
  }

  const newParagraph: ParagraphBlock = {
    id: blockId(),
    type: "paragraph",
    text: "",
  };

  return {
    blocks: [
      ...merged.slice(0, afterImagesIndex),
      newParagraph,
      ...merged.slice(afterImagesIndex),
    ],
    focusParagraphId: newParagraph.id,
  };
}

export function fileNameToAlt(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
}
