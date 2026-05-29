"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center",
        "bg-background/60 backdrop-blur-[2px]",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/95 px-8 py-6 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={2} />
        <p className="text-sm font-medium text-foreground">
          {message ?? "Please wait…"}
        </p>
      </div>
    </div>
  );
}
