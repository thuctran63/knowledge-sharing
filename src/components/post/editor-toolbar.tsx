"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditorSaveStatus } from "@/components/post/editor-save-status";
import type { SyncState } from "@/lib/post-editor-utils";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  variant: "new" | "edit";
  syncState: SyncState;
  lastSavedAt: number | null;
  uploadLabel?: string | null;
  isDraft?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function EditorToolbar({
  variant,
  syncState,
  lastSavedAt,
  uploadLabel,
  isDraft = true,
  className,
  actions,
}: EditorToolbarProps) {
  const backHref = variant === "edit" ? "/drafts" : "/";
  const backLabel = variant === "edit" ? "Articles" : "Home";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 w-full text-sm",
        className
      )}
    >
      <Link
        href={backHref}
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground -ml-1 min-h-[44px] min-w-[44px] sm:min-w-0 sm:px-1"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">{backLabel}</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0 ml-auto">
        {isDraft && (
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex text-[10px] font-normal px-2 py-0"
          >
            Unpublished
          </Badge>
        )}
        {uploadLabel && (
          <span className="hidden md:inline text-xs text-muted-foreground animate-pulse truncate max-w-[140px]">
            {uploadLabel}
          </span>
        )}
        <EditorSaveStatus syncState={syncState} lastSavedAt={lastSavedAt} />
        {actions}
      </div>
    </div>
  );
}
