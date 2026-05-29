"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine, Clock, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useLoading } from "@/components/providers/loading-provider";
import { timeAgo, readingTime } from "@/lib/utils";

interface DraftCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    updatedAt: Date;
  };
}

export const DraftCard = memo(function DraftCard({ post }: DraftCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { withLoading } = useLoading();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const title =
    post.title.trim() && post.title.toLowerCase() !== "untitled"
      ? post.title
      : "Untitled article";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete draft");
        }
        toast({ title: "Draft deleted", variant: "success" });
        setConfirmOpen(false);
        router.refresh();
      }, "Deleting article…");
    } catch (error) {
      toast({
        title: "Could not delete draft",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-colors hover:border-primary/20">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="secondary" className="text-[11px] font-normal">
              Unpublished
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              Edited {timeAgo(post.updatedAt)}
            </span>
          </div>
          <h3 className="font-heading font-semibold tracking-tight truncate">
            {title}
          </h3>
          {post.excerpt ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          ) : post.content.trim() ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {post.content
                .replace(/!\[[^\]]*\]\([^)]+\)/g, "[image]")
                .slice(0, 120)}
            </p>
          ) : null}
          {post.content.trim() && (
            <p className="mt-2 text-xs text-muted-foreground">
              {readingTime(post.content)} min read
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/edit/${post.slug}`}>
              <PenLine className="h-3.5 w-3.5" />
              Continue editing
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </article>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete draft?</DialogTitle>
            <DialogDescription>
              &ldquo;{title}&rdquo; will be permanently deleted, including any
              images uploaded for this draft. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete draft
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
