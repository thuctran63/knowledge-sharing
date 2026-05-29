"use client";

import { useCallback, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getClipboardImageFiles } from "@/lib/image-upload";
import {
  type EditorBlock,
  blockId,
  updateParagraphBlock,
  removeImageBlock,
} from "@/lib/markdown-blocks";

interface EditorBodyProps {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  onPasteFiles: (files: File[], afterBlockId: string | null) => void;
  onDropFiles: (files: File[]) => void;
  onRemoveImage: (blockId: string, url: string) => void;
  disabled?: boolean;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
}

export function EditorBody({
  blocks,
  onChange,
  onPasteFiles,
  onDropFiles,
  onRemoveImage,
  disabled,
  isDragging,
  onDragStateChange,
}: EditorBodyProps) {
  const dragCounter = useRef(0);
  const focusBlockRef = useRef<string | null>(null);

  const updateParagraph = useCallback(
    (id: string, text: string) => {
      onChange(updateParagraphBlock(blocks, id, text));
    },
    [blocks, onChange]
  );

  const handleParagraphKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    block: EditorBlock,
    index: number
  ) => {
    if (block.type !== "paragraph") return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newBlock = { id: blockId(), type: "paragraph" as const, text: "" };
      const next = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1),
      ];
      onChange(next);
      requestAnimationFrame(() => {
        document.getElementById(`block-${newBlock.id}`)?.focus();
      });
    }

    if (
      e.key === "Backspace" &&
      block.text === "" &&
      blocks.length > 1 &&
      index > 0
    ) {
      e.preventDefault();
      const prev = blocks[index - 1];
      onChange(blocks.filter((b) => b.id !== block.id));
      if (prev.type === "paragraph") {
        requestAnimationFrame(() => {
          document.getElementById(`block-${prev.id}`)?.focus();
        });
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) onDragStateChange(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      onDragStateChange(false);
    }
  };

  const isEmpty =
    blocks.length === 1 &&
    blocks[0].type === "paragraph" &&
    !blocks[0].text.trim();

  const handlePaste = (e: React.ClipboardEvent) => {
    const imageFiles = getClipboardImageFiles(e.clipboardData);
    if (!imageFiles.length) return;

    e.preventDefault();
    e.stopPropagation();

    const anchor =
      focusBlockRef.current ??
      blocks.find((b) => b.type === "paragraph")?.id ??
      null;
    onPasteFiles(imageFiles, anchor);
  };

  return (
    <div
      className="relative min-h-[420px] rounded-xl border border-border bg-card"
      data-editor-body
      onPasteCapture={handlePaste}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        onDragStateChange(false);
        if (e.dataTransfer.files?.length) {
          onDropFiles(Array.from(e.dataTransfer.files));
        }
      }}
    >
      <div className="space-y-1 p-4 sm:p-6">
        {blocks.map((block, index) => {
          if (block.type === "paragraph") {
            return (
              <textarea
                key={block.id}
                id={`block-${block.id}`}
                value={block.text}
                disabled={disabled}
                placeholder={
                  isEmpty && index === 0
                    ? "Tell your story… Markdown works here (**bold**, # headings, lists, etc.)"
                    : undefined
                }
                onFocus={() => {
                  focusBlockRef.current = block.id;
                }}
                onChange={(e) => updateParagraph(block.id, e.target.value)}
                onKeyDown={(e) => handleParagraphKeyDown(e, block, index)}
                rows={Math.max(1, block.text.split("\n").length)}
                className={cn(
                  "w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 font-body",
                  isEmpty && index === 0 && "min-h-[200px]"
                )}
              />
            );
          }

          const displayUrl = block.previewUrl || block.url;

          return (
            <figure
              key={block.id}
              className="group relative my-6 overflow-hidden rounded-lg border border-border/60 bg-muted/20"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayUrl}
                  alt={block.alt || "Article image"}
                  className={cn(
                    "w-full max-h-[480px] object-contain bg-muted/30",
                    block.status === "uploading" && "opacity-70"
                  )}
                />
                {block.status === "uploading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-[1px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                  </div>
                )}
                {block.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                    <p className="text-sm text-destructive">Upload failed</p>
                  </div>
                )}
                <button
                  type="button"
                  disabled={disabled || block.status === "uploading"}
                  onClick={() => onRemoveImage(block.id, block.url)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <figcaption className="border-t border-border/40 px-3 py-2">
                <input
                  type="text"
                  value={block.alt}
                  disabled={disabled || block.status !== "ready"}
                  placeholder="Add a caption (optional)"
                  onChange={(e) => {
                    onChange(
                      blocks.map((b) =>
                        b.id === block.id && b.type === "image"
                          ? { ...b, alt: e.target.value }
                          : b
                      )
                    );
                  }}
                  className="w-full border-0 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </figcaption>
            </figure>
          );
        })}
      </div>

      {isEmpty && !isDragging && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <p className="text-xs text-muted-foreground/70">
            Paste, drop, or use &ldquo;Insert image&rdquo; — images appear inline
            in your article.
          </p>
        </div>
      )}

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[2px]">
          <Upload className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <p className="text-sm font-medium text-primary">Drop to add image</p>
        </div>
      )}
    </div>
  );
}
