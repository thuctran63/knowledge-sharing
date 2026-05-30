"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useLoading } from "@/components/providers/loading-provider";
import { timeAgo, cn } from "@/lib/utils";
import { MessageCircle, Edit3, Trash2, Reply } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CommentWithAuthor } from "@/types";

interface CommentListProps {
  comments: CommentWithAuthor[];
  postId: string;
}

export function CommentList({ comments, postId }: CommentListProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { withLoading } = useLoading();
  const router = useRouter();

  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topLevelComments = comments.filter((c) => !c.parentId);

  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parentId === commentId);

  const handleSubmit = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setSubmitting(true);

    try {
      await withLoading(async () => {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            postId,
            parentId: parentId || null,
          }),
        });

        if (!res.ok) throw new Error("Failed to post comment");

        setNewComment("");
        setReplyContent("");
        setReplyTo(null);
        toast({
          title: "Comment posted",
          variant: "success",
        });
        router.refresh();
      }, "Posting comment…");
    } catch {
      toast({
        title: "Error posting comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await withLoading(async () => {
        const res = await fetch(`/api/comments`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: commentId, content: editContent.trim() }),
        });

        if (!res.ok) throw new Error("Failed to edit comment");

        setEditingId(null);
        toast({ title: "Comment updated", variant: "success" });
        router.refresh();
      }, "Updating comment…");
    } catch {
      toast({ title: "Error updating comment", variant: "destructive" });
    }
  };

  const handleDelete = async (commentId: string, hasReplies: boolean) => {
    const msg = hasReplies
      ? "Delete this comment? All replies will also be deleted."
      : "Delete this comment?";
    if (!confirm(msg)) return;

    try {
      await withLoading(async () => {
        const res = await fetch(`/api/comments`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: commentId }),
        });

        if (!res.ok) throw new Error("Failed to delete comment");

        toast({ title: "Comment deleted", variant: "success" });
        router.refresh();
      }, "Deleting comment…");
    } catch {
      toast({ title: "Error deleting comment", variant: "destructive" });
    }
  };

  const renderComment = (comment: CommentWithAuthor, isReply = false) => {
    const replies = getReplies(comment.id);
    const isOwner = session?.user?.id === comment.authorId;

    return (
    <div
      id={`comment-${comment.id}`}
      key={comment.id}
      className={cn(
        "animate-fade-in scroll-mt-24",
        isReply && "ml-4 pl-2 sm:ml-8 sm:pl-4 border-l-2 border-border/50"
      )}
    >
      <div className="flex gap-2 sm:gap-3 py-3">
          <UserAvatar
            src={comment.author.image}
            name={comment.author.name}
            size="sm"
            className="shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {comment.author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(comment.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90">
                {comment.content}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2">
              {session && !editingId && (
                <button
                  onClick={() =>
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                  }
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
              {isOwner && !editingId && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id, replies.length > 0)}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-md text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </>
              )}
            </div>

            {replyTo === comment.id && (
              <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    maxLength={2000}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? "Posting..." : "Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {replies.length > 0 && (
          <div className="space-y-1">
            {replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
        <h3 className="text-lg font-heading font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {session && (
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            maxLength={2000}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => handleSubmit()}
              disabled={submitting || !newComment.trim()}
              className="gap-2"
            >
              {submitting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </div>
      )}

      {!session && comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {comments.length > 0 ? (
        <div className="divide-y divide-border/50">
          {topLevelComments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}
