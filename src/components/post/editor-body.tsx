"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getClipboardImageFiles } from "@/lib/image-upload";
import {
  type EditorBlock,
  blockId,
  updateParagraphBlock,
  blocksToMarkdown,
  markdownToBlocks,
} from "@/lib/markdown-blocks";

export type FocusBlockRequest = { id: string; seq: number };

function focusParagraphElement(id: string) {
  const el = document.getElementById(`block-${id}`);
  if (!(el instanceof HTMLTextAreaElement) || el.disabled) return false;

  el.focus({ preventScroll: true });
  const end = el.value.length;
  el.setSelectionRange(end, end);
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  return true;
}

interface EditorBodyProps {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  onPasteFiles: (files: File[], afterBlockId: string | null) => void;
  onDropFiles: (files: File[], afterBlockId: string | null) => void;
  onRemoveImage: (blockId: string, url: string) => void;
  disabled?: boolean;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  focusBlockRequest?: FocusBlockRequest | null;
  onFocusBlockHandled?: () => void;
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
  focusBlockRequest,
  onFocusBlockHandled,
}: EditorBodyProps) {
  const dragCounter = useRef(0);
  const focusBlockRef = useRef<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  const clearSelectAll = useCallback(() => setSelectAll(false), []);

  const resetToEmpty = useCallback(() => {
    onChange([{ id: blockId(), type: "paragraph", text: "" }]);
    setSelectAll(false);
  }, [onChange]);

  const handleSelectAll = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (!target.closest("[data-editor-body]")) return;

      e.preventDefault();
      setSelectAll(true);
      target.setSelectionRange(0, target.value.length);
    },
    []
  );

  const handleSelectAllAction = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectAll) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        resetToEmpty();
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const newId = blockId();
        onChange([{ id: newId, type: "paragraph", text: e.key }]);
        setSelectAll(false);
        requestAnimationFrame(() => focusParagraphElement(newId));
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        clearSelectAll();
      }
    },
    [selectAll, resetToEmpty, onChange, clearSelectAll]
  );

  useEffect(() => {
    if (!focusBlockRequest) return;

    let cancelled = false;
    const { id } = focusBlockRequest;

    const attemptFocus = () => {
      if (cancelled) return false;
      return focusParagraphElement(id);
    };

    const raf = requestAnimationFrame(() => {
      if (attemptFocus()) {
        onFocusBlockHandled?.();
        return;
      }

      requestAnimationFrame(() => {
        if (attemptFocus()) {
          onFocusBlockHandled?.();
          return;
        }

        window.setTimeout(() => {
          if (attemptFocus()) onFocusBlockHandled?.();
        }, 50);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [focusBlockRequest, blocks, onFocusBlockHandled]);

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

    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      handleSelectAll(e);
      return;
    }

    if (selectAll) {
      handleSelectAllAction(e);
      return;
    }

    if (e.key === "Backspace") {
      const el = e.currentTarget;

      if (block.text === "" && blocks.length > 1) {
        e.preventDefault();
        const prev = blocks[index - 1];
        onChange(blocks.filter((b) => b.id !== block.id));
        if (prev?.type === "paragraph") {
          requestAnimationFrame(() => {
            focusParagraphElement(prev.id);
          });
        }
        return;
      }

      if (
        el.selectionStart === 0 &&
        el.selectionEnd === 0 &&
        index > 0 &&
        block.text.length > 0
      ) {
        const prev = blocks[index - 1];
        if (prev.type === "paragraph") {
          e.preventDefault();
          const cursorPos = prev.text.length;
          const mergedText = prev.text + block.text;
          onChange(
            blocks
              .map((b) =>
                b.id === prev.id && b.type === "paragraph"
                  ? { ...b, text: mergedText }
                  : b
              )
              .filter((b) => b.id !== block.id)
          );
          requestAnimationFrame(() => {
            const merged = document.getElementById(`block-${prev.id}`);
            if (merged instanceof HTMLTextAreaElement) {
              merged.focus();
              merged.setSelectionRange(cursorPos, cursorPos);
            }
          });
        }
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
    if (imageFiles.length) {
      e.preventDefault();
      e.stopPropagation();

      const anchor =
        focusBlockRef.current ??
        blocks.find((b) => b.type === "paragraph")?.id ??
        null;
      onPasteFiles(imageFiles, anchor);
      return;
    }

    if (selectAll) {
      const text = e.clipboardData.getData("text/plain");
      if (text) {
        e.preventDefault();
        e.stopPropagation();
        onChange(markdownToBlocks(text));
        setSelectAll(false);
      }
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (!selectAll) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", blocksToMarkdown(blocks));
  };

  const handleCut = (e: React.ClipboardEvent) => {
    if (!selectAll) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", blocksToMarkdown(blocks));
    resetToEmpty();
  };

  return (
    <div
      className="relative rounded-2xl border border-border/80 bg-card shadow-sm"
      data-editor-body
      onPasteCapture={handlePaste}
      onCopyCapture={handleCopy}
      onCutCapture={handleCut}
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
          const anchor =
            focusBlockRef.current ??
            blocks.find((b) => b.type === "paragraph")?.id ??
            null;
          onDropFiles(Array.from(e.dataTransfer.files), anchor);
        }
      }}
    >
      <div className="space-y-2 p-6 sm:p-8 lg:p-10">
        {blocks.map((block, index) => {
          if (block.type === "paragraph") {
            const prevBlock = index > 0 ? blocks[index - 1] : null;
            const afterImage =
              prevBlock?.type === "image" && !block.text.trim();

            return (
              <textarea
                key={block.id}
                id={`block-${block.id}`}
                value={block.text}
                disabled={disabled}
                placeholder={
                  isEmpty && index === 0
                    ? "Tell your story… Markdown works here (**bold**, # headings, lists, etc.)"
                    : afterImage
                      ? "Continue writing…"
                      : undefined
                }
                onFocus={() => {
                  focusBlockRef.current = block.id;
                }}
                onMouseDown={() => {
                  if (selectAll) clearSelectAll();
                }}
                onChange={(e) => {
                  if (selectAll) clearSelectAll();
                  updateParagraph(block.id, e.target.value);
                }}
                onKeyDown={(e) => handleParagraphKeyDown(e, block, index)}
                rows={Math.max(1, block.text.split("\n").length)}
                className={cn(
                  "w-full resize-none border-0 bg-transparent p-0 text-[17px] sm:text-lg leading-[1.75] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 font-body transition-colors",
                  selectAll && "bg-primary/10",
                  isEmpty && index === 0 && "min-h-[160px]",
                  afterImage && "min-h-[44px]"
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
                  loading="lazy"
                  className={cn(
                    "w-full max-h-[min(70vh,640px)] object-contain bg-muted/30",
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
