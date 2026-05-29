"use client";

import { Check, CloudOff, Loader2 } from "lucide-react";
import type { SyncState } from "@/lib/post-editor-utils";
import { cn } from "@/lib/utils";

interface EditorSaveStatusProps {
  syncState: SyncState;
  lastSavedAt: number | null;
  className?: string;
}

function formatSavedTime(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 10) return "Saved just now";
  if (sec < 60) return `Saved ${sec}s ago`;
  const min = Math.floor(sec / 60);
  return `Saved ${min}m ago`;
}

export function EditorSaveStatus({
  syncState,
  lastSavedAt,
  className,
}: EditorSaveStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      {syncState === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving draft…</span>
        </>
      )}
      {syncState === "saved" && lastSavedAt && (
        <>
          <Check className="h-3.5 w-3.5 text-primary" />
          <span>{formatSavedTime(lastSavedAt)}</span>
        </>
      )}
      {syncState === "unsaved" && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Unsaved changes</span>
        </>
      )}
      {syncState === "error" && (
        <>
          <CloudOff className="h-3.5 w-3.5 text-destructive" />
          <span className="text-destructive">Couldn&apos;t save — retrying…</span>
        </>
      )}
    </div>
  );
}
