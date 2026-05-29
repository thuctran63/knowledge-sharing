"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { slugify, generateSlug } from "@/lib/utils";
import type { Post } from "@prisma/client";

interface PostEditorProps {
  post?: Post & { tags: { id: string; name: string }[] };
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    post?.tags.map((t) => t.name) || []
  );
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const slug = post?.slug || generateSlug(title);

    try {
      const res = await fetch(post ? `/api/posts/${post.id}` : "/api/posts", {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          content,
          excerpt: excerpt.trim(),
          published,
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save post");
      }

      const data = await res.json();

      toast({
        title: post ? "Post updated" : "Post created",
        description: post
          ? "Your changes have been saved."
          : "Your article has been published.",
        variant: "success",
      });

      router.push(`/post/${data.slug}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Sign in to write articles</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Title..."
          value={title}
          onChange={handleTitleChange}
          className="h-auto border-0 bg-transparent px-0 text-3xl font-heading font-semibold tracking-tight placeholder:text-muted-foreground/30 focus-visible:ring-0"
        />
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Write a brief excerpt..."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="resize-none border-0 bg-transparent px-0 text-sm text-muted-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0"
          rows={2}
        />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Content
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview(!preview)}
            className="text-xs gap-1.5"
          >
            {preview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Edit
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Preview
              </>
            )}
          </Button>
        </div>

        {preview ? (
          <div className="min-h-[400px] rounded-xl border border-border bg-card p-6 prose-custom">
            <div className="prose-custom max-w-none">
              {content ? (
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                <p className="text-muted-foreground italic">
                  Nothing to preview yet...
                </p>
              )}
            </div>
          </div>
        ) : (
          <Textarea
            placeholder="Write your article content here... Supports Markdown!"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] rounded-xl border border-border bg-card p-4 text-sm leading-relaxed resize-y font-body focus-visible:ring-1"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Tags
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="h-9 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= 5}
          >
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Up to 5 tags. Press Enter to add.
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPublished(!published);
          }}
          className={cn(
            "gap-2 transition-colors",
            published && "text-emerald-500"
          )}
        >
          {published ? (
            <>
              <Eye className="h-4 w-4" /> Published
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" /> Draft
            </>
          )}
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {post ? "Update" : "Publish"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
