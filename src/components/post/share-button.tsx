"use client";

import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, url, className }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Article URL copied to clipboard.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted/50 hover:text-primary",
        className
      )}
      aria-label="Share article"
    >
      <Share2 className="h-5 w-5" strokeWidth={1.5} />
      <span className="hidden sm:inline">Share</span>
    </button>
  );
}
