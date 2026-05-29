"use client";

import { X } from "lucide-react";
import { parseMarkdownImages } from "@/lib/post-editor-utils";
import { cn } from "@/lib/utils";

interface EditorImageGalleryProps {
  content: string;
  onRemove: (url: string) => void;
  className?: string;
}

export function EditorImageGallery({
  content,
  onRemove,
  className,
}: EditorImageGalleryProps) {
  const images = parseMarkdownImages(content).filter((img) => img.url.trim());

  if (!images.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Images in this article ({images.length})
      </p>
      <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        {images.map((img) => (
          <div
            key={img.url}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-background shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || "Article image"}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(img.url)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
