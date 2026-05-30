"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

type DeletePostMode = "draft" | "published";

const copyByMode = {
  draft: {
    label: "Delete draft",
    dialogTitle: "Delete draft?",
    displayFallback: "Untitled draft",
    confirmLabel: "Delete draft",
    successTitle: "Draft deleted",
    errorTitle: "Could not delete draft",
    loadingLabel: "Deleting article…",
    description:
      "will be permanently deleted, including any images. This cannot be undone.",
  },
  published: {
    label: "Delete",
    dialogTitle: "Delete article?",
    displayFallback: "Untitled article",
    confirmLabel: "Delete article",
    successTitle: "Article deleted",
    errorTitle: "Could not delete article",
    loadingLabel: "Deleting article…",
    description:
      "will be permanently deleted, including comments, likes, and images. This cannot be undone.",
  },
} as const;

interface DeleteDraftButtonProps {
  postId: string;
  postTitle?: string;
  redirectTo?: string;
  mode?: DeletePostMode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  className?: string;
  label?: string;
}

export function DeleteDraftButton({
  postId,
  postTitle = "",
  redirectTo = "/drafts",
  mode = "draft",
  variant = "ghost",
  size = "sm",
  className,
  label,
}: DeleteDraftButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { withLoading } = useLoading();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const copy = copyByMode[mode];
  const displayTitle =
    postTitle.trim() && postTitle.toLowerCase() !== "untitled"
      ? postTitle
      : copy.displayFallback;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete post");
        }
        toast({ title: copy.successTitle, variant: "success" });
        setConfirmOpen(false);
        router.push(redirectTo);
        router.refresh();
      }, copy.loadingLabel);
    } catch (error) {
      toast({
        title: copy.errorTitle,
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(
          "gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10",
          className
        )}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label ?? copy.label}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.dialogTitle}</DialogTitle>
            <DialogDescription>
              &ldquo;{displayTitle}&rdquo; {copy.description}
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
                  {copy.confirmLabel}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
