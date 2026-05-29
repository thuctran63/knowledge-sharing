"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo, cn } from "@/lib/utils";
import { MessageCircle, Edit3, Trash2, Reply, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CommentWithAuthor } from "@/types";

interface CommentListProps {
  comments: CommentWithAuthor[];
  postId: string;
}

export function CommentList({ comments, postId }: CommentListProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
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
      const res = await fetch(`/api/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId, content: editContent.trim() }),
      });

      if (!res.ok) throw new Error("Failed to edit comment");

      setEditingId(null);
      toast({ title: "Comment updated", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Error updating comment", variant: "destructive" });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId }),
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      toast({ title: "Comment deleted", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Error deleting comment", variant: "destructive" });
    }
  };

  const renderComment = (comment: CommentWithAuthor, isReply = false) => {
    const replies = getReplies(comment.id);
    const isOwner = session?.user?.id === comment.authorId;

    return (
      <div
        key={comment.id}
        className={cn(
          "animate-fade-in",
          isReply && "ml-8 pl-4 border-l-2 border-border/50"
        )}
      >
        <div className="flex gap-3 py-3">
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            <AvatarImage src={comment.author.image || ""} />
            <AvatarFallback className="text-xs">
              {comment.author.name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>

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

            <div className="flex items-center gap-3 mt-2">
              {session && !editingId && (
                <button
                  onClick={() =>
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                  }
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-3 w-3" />
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
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
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

  if (comments.length === 0 && !session) {
    return null;
  }

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
