"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useLoading } from "@/components/providers/loading-provider";
import { useSession } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Loader2,
  X,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import { DeleteDraftButton } from "@/components/post/delete-draft-button";
import { cn, generateSlug } from "@/lib/utils";
import {
  type EditorSnapshot,
  type SyncState,
  makeSnapshot,
  snapshotsEqual,
  isEmptyDraft,
  draftSlug,
  urlsInSnapshot,
} from "@/lib/post-editor-utils";
import { getClipboardImageFiles, normalizePastedImageFile } from "@/lib/image-upload";
import {
  type EditorBlock,
  markdownToBlocks,
  blocksToMarkdown,
  hasBlockContent,
  insertImagesWithTypingParagraph,
  removeImageBlock,
  blockId,
  fileNameToAlt,
} from "@/lib/markdown-blocks";
import { EditorToolbar } from "@/components/post/editor-toolbar";
import type { FocusBlockRequest } from "@/components/post/editor-body";
import type { Post } from "@prisma/client";

const MarkdownPreview = dynamic(
  () => import("@/components/post/markdown-preview").then((m) => m.MarkdownPreview),
  { loading: () => <div className="min-h-[420px] animate-pulse rounded-xl bg-muted" /> }
);

const EditorBody = dynamic(
  () => import("@/components/post/editor-body").then((m) => m.EditorBody),
  { loading: () => <div className="min-h-[420px] animate-pulse rounded-xl bg-muted" /> }
);

type EditorView = "story" | "preview";

interface PostEditorProps {
  post?: Post & { tags: { id: string; name: string }[] };
  variant?: "new" | "edit";
}

export function PostEditor({ post, variant = post ? "edit" : "new" }: PostEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const { withLoading } = useLoading();

  const [title, setTitle] = useState(post?.title || "");
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    markdownToBlocks(post?.content || "")
  );
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    post?.tags.map((t) => t.name) || []
  );
  const [postId, setPostId] = useState<string | undefined>(post?.id);
  const [slug, setSlug] = useState(post?.slug || "");
  const [syncState, setSyncState] = useState<SyncState>(post ? "saved" : "saved");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    post ? Date.now() : null
  );
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [editorView, setEditorView] = useState<EditorView>("story");
  const [isDragging, setIsDragging] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [focusBlockRequest, setFocusBlockRequest] =
    useState<FocusBlockRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFocusParagraphRef = useRef<string | null>(null);
  const lastSavedRef = useRef<EditorSnapshot>(
    makeSnapshot(
      post?.title || "",
      post?.content || "",
      post?.excerpt || "",
      post?.published ?? false,
      post?.tags.map((t) => t.name) || []
    )
  );
  const sessionUploadsRef = useRef<string[]>([]);
  const postIdRef = useRef(post?.id);
  const slugRef = useRef(post?.slug || "");
  const skipLeaveGuardRef = useRef(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPersistingRef = useRef(false);
  const draftInitRef = useRef(!!post);
  const addImageFilesRef = useRef<
    (files: File[], afterBlockId?: string | null) => Promise<void>
  >(async () => {});

  postIdRef.current = postId;
  slugRef.current = slug;

  const content = useMemo(() => blocksToMarkdown(blocks), [blocks]);

  const currentSnapshot = useMemo(
    () => makeSnapshot(title, content, excerpt, published, tags),
    [title, content, excerpt, published, tags]
  );

  const isDirty = useCallback(() => {
    return (
      !snapshotsEqual(currentSnapshot, lastSavedRef.current) ||
      sessionUploadsRef.current.length > 0 ||
      blocks.some((b) => b.type === "image" && b.status === "uploading")
    );
  }, [currentSnapshot, blocks]);

  const needsLeaveConfirm = useCallback(() => {
    return (
      !skipLeaveGuardRef.current &&
      (isDirty() || syncState === "unsaved" || syncState === "saving")
    );
  }, [isDirty, syncState]);

  const hasContent = useCallback(() => {
    return (
      title.trim().length > 0 ||
      excerpt.trim().length > 0 ||
      tags.length > 0 ||
      hasBlockContent(blocks)
    );
  }, [title, excerpt, tags, blocks]);

  const persistToServer = useCallback(
    async (
      options: {
        forcePublished?: boolean;
        createIfNeeded?: boolean;
        allowEmpty?: boolean;
        /** Background autosave — no spinner, no toast */
        silent?: boolean;
      } = {}
    ): Promise<boolean> => {
      if (isPersistingRef.current) return false;

      const snapshotContent = blocksToMarkdown(blocks);
      const mustCreate = !postIdRef.current;

      if (mustCreate && !options.createIfNeeded) return false;
      if (mustCreate && !options.allowEmpty && !hasContent()) return false;

      if (blocks.some((b) => b.type === "image" && b.status === "uploading")) {
        return false;
      }

      isPersistingRef.current = true;
      if (!options.silent) {
        setSyncState("saving");
      }

      try {
        let id = postIdRef.current;
        let currentSlug = slugRef.current;
        const willPublish = options.forcePublished ?? published;

        if (!id) {
          currentSlug = draftSlug();
          const createRes = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim() || "Untitled",
              slug: currentSlug,
              content: snapshotContent,
              excerpt: excerpt.trim(),
              published: false,
              tags,
            }),
          });

          if (!createRes.ok) {
            const data = await createRes.json();
            throw new Error(data.error || "Failed to create draft");
          }

          const created = await createRes.json();
          id = created.id;
          currentSlug = created.slug;
          setPostId(id);
          setSlug(currentSlug);
          postIdRef.current = id;
          slugRef.current = currentSlug;

          if (!post) {
            router.replace(`/edit/${currentSlug}`);
          }
        }

        const nextSlug =
          post?.slug || (title.trim() ? generateSlug(title) : currentSlug);

        const res = await fetch(`/api/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Untitled",
            slug: nextSlug,
            content: snapshotContent,
            excerpt: excerpt.trim(),
            published: willPublish,
            tags,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save");
        }

        const data = await res.json();
        if (data.slug && data.slug !== slugRef.current) {
          setSlug(data.slug);
          slugRef.current = data.slug;
          if (!post) router.replace(`/edit/${data.slug}`);
        }

        lastSavedRef.current = makeSnapshot(
          title,
          snapshotContent,
          excerpt,
          willPublish,
          tags
        );
        sessionUploadsRef.current = [];
        setPublished(willPublish);
        setSyncState("saved");
        setLastSavedAt(Date.now());
        return true;
      } catch (error) {
        setSyncState(options.silent ? "unsaved" : "error");
        if (!options.silent) {
          toast({
            title: "Save failed",
            description:
              error instanceof Error ? error.message : "Please try again",
            variant: "destructive",
          });
        }
        return false;
      } finally {
        isPersistingRef.current = false;
      }
    },
    [title, blocks, excerpt, published, tags, post, router, toast, hasContent]
  );

  // Medium: create empty draft as soon as user opens new story
  useEffect(() => {
    if (!session || post || draftInitRef.current) return;
    draftInitRef.current = true;
    void persistToServer({ createIfNeeded: true, allowEmpty: true, silent: true });
  }, [session, post, persistToServer]);

  useEffect(() => {
    if (!session) return;
    if (!isDirty()) {
      if (syncState === "unsaved") setSyncState("saved");
      return;
    }
    if (!hasContent()) return;

    setSyncState("unsaved");

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void persistToServer({ createIfNeeded: true, silent: true });
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [
    session,
    title,
    blocks,
    excerpt,
    tags,
    published,
    isDirty,
    persistToServer,
    syncState,
    hasContent,
  ]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!needsLeaveConfirm()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [needsLeaveConfirm]);

  // Catch Ctrl+V when focus is on title/excerpt/tags (outside editor body)
  useEffect(() => {
    if (editorView !== "story") return;

    const onPaste = (e: ClipboardEvent) => {
      const imageFiles = getClipboardImageFiles(e.clipboardData);
      if (!imageFiles.length) return;

      const target = e.target as HTMLElement;
      if (target.closest("[data-editor-body]")) return;

      const isCaption =
        target instanceof HTMLInputElement &&
        target.placeholder === "Add a caption (optional)";
      if (isCaption) return;

      e.preventDefault();
      void addImageFilesRef.current(imageFiles);
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [editorView]);

  const ensurePostForUpload = async (): Promise<string> => {
    if (postIdRef.current) return postIdRef.current;

    const ok = await persistToServer({
      createIfNeeded: true,
      allowEmpty: true,
    });
    if (!ok || !postIdRef.current) {
      throw new Error("Could not create draft for image upload");
    }
    return postIdRef.current;
  };

  const uploadImage = async (file: File, id: string): Promise<string> => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/posts/${id}/images`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }

    const { url } = await res.json();
    sessionUploadsRef.current.push(url);
    return url;
  };

  const requestParagraphFocus = useCallback((paragraphId: string) => {
    pendingFocusParagraphRef.current = paragraphId;
    setFocusBlockRequest({ id: paragraphId, seq: Date.now() });
  }, []);

  const addImageFiles = async (
    files: File[],
    afterBlockId: string | null = null
  ) => {
    const imageFiles = files
      .map((f) => normalizePastedImageFile(f))
      .filter((f): f is File => f !== null);

    if (!imageFiles.length) {
      toast({
        title: "No images found",
        description: "Use JPEG, PNG, GIF, or WebP.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setEditorView("story");

    const pendingBlocks: Extract<EditorBlock, { type: "image" }>[] =
      imageFiles.map((file) => ({
        id: blockId(),
        type: "image" as const,
        url: "",
        alt: fileNameToAlt(file.name),
        status: "uploading" as const,
        previewUrl: URL.createObjectURL(file),
      }));

    let focusParagraphId: string | null = null;
    setBlocks((prev) => {
      const lastParagraph = [...prev].reverse().find((b) => b.type === "paragraph");
      const anchor =
        afterBlockId ?? (lastParagraph ? lastParagraph.id : prev[prev.length - 1]?.id ?? null);
      const result = insertImagesWithTypingParagraph(prev, anchor, pendingBlocks);
      focusParagraphId = result.focusParagraphId;
      return result.blocks;
    });

    if (focusParagraphId) {
      requestParagraphFocus(focusParagraphId);
    }

    try {
      await withLoading(async () => {
        const id = await ensurePostForUpload();

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const pending = pendingBlocks[i];
          setUploadLabel(`${i + 1}/${imageFiles.length}: ${file.name}`);

          try {
            const url = await uploadImage(file, id);
            setBlocks((prev) =>
              prev.map((b) =>
                b.id === pending.id && b.type === "image"
                  ? {
                      ...b,
                      url,
                      status: "ready" as const,
                      previewUrl: undefined,
                    }
                  : b
              )
            );
            if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
          } catch {
            setBlocks((prev) =>
              prev.map((b) =>
                b.id === pending.id && b.type === "image"
                  ? { ...b, status: "error" as const }
                  : b
              )
            );
            throw new Error(`Failed to upload ${file.name}`);
          }
        }

        toast({
          title:
            imageFiles.length === 1
              ? "Image added"
              : `${imageFiles.length} images added`,
          variant: "success",
        });
        await persistToServer({ createIfNeeded: true });
      }, "Uploading images…");
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadLabel(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (pendingFocusParagraphRef.current) {
        requestParagraphFocus(pendingFocusParagraphRef.current);
      }
    }
  };

  addImageFilesRef.current = addImageFiles;

  const handleRemoveImage = (blockIdToRemove: string, url: string) => {
    setBlocks((prev) => removeImageBlock(prev, blockIdToRemove));
    if (url && sessionUploadsRef.current.includes(url)) {
      sessionUploadsRef.current = sessionUploadsRef.current.filter(
        (u) => u !== url
      );
      if (postIdRef.current) {
        void fetch(`/api/posts/${postIdRef.current}/discard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: [url], deletePost: false }),
        });
      }
    }
  };

  const discardAndLeave = async () => {
    await withLoading(async () => {
      const saved = lastSavedRef.current;
      const id = postIdRef.current;

      if (id) {
        const savedUrls = urlsInSnapshot(saved);
        const orphanUrls = sessionUploadsRef.current.filter(
          (u) => !savedUrls.has(u)
        );

        const deletePost =
          !post && isEmptyDraft(saved) && isEmptyDraft(currentSnapshot);

        await fetch(`/api/posts/${id}/discard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: orphanUrls, deletePost }),
        });
      }

      sessionUploadsRef.current = [];
      skipLeaveGuardRef.current = true;
    }, "Discarding changes…");
  };

  const requestLeave = (action: () => void) => {
    if (!needsLeaveConfirm()) {
      action();
      return;
    }
    pendingLeaveRef.current = action;
    setLeaveDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!hasBlockContent(blocks)) {
      toast({ title: "Content is required", variant: "destructive" });
      return;
    }
    if (blocks.some((b) => b.type === "image" && b.status === "uploading")) {
      toast({
        title: "Wait for uploads",
        description: "Images are still uploading.",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      await withLoading(async () => {
        const ok = await persistToServer({
          forcePublished: published,
          createIfNeeded: true,
        });

        if (ok) {
          skipLeaveGuardRef.current = true;
          toast({
            title: published ? "Published!" : "Draft saved",
            description: published
              ? undefined
              : "Find it anytime under My articles in the menu.",
            variant: "success",
          });
          if (published) {
            router.push(`/post/${slugRef.current}`);
          } else {
            router.push("/drafts");
          }
          router.refresh();
        }
      }, published ? "Publishing…" : "Saving draft…");
    } finally {
      setPublishing(false);
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
    <>
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="sticky top-16 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="container max-w-3xl mx-auto px-4 h-12 flex items-center">
            <EditorToolbar
              variant={variant}
              syncState={syncState}
              lastSavedAt={lastSavedAt}
              uploadLabel={uploadLabel}
              isDraft={!published}
            />
          </div>
        </div>

        <div className="container max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">
        <Input
          type="text"
          placeholder="Title"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          className="h-auto border-0 bg-transparent px-0 text-2xl sm:text-3xl font-heading font-semibold tracking-tight placeholder:text-muted-foreground/30 focus-visible:ring-0"
        />

        <Textarea
          placeholder="Short summary (optional)"
          value={excerpt}
          maxLength={300}
          onChange={(e) => setExcerpt(e.target.value)}
          className="resize-none border-0 bg-transparent px-0 text-sm text-muted-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0"
          rows={2}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-1">
            <div className="flex flex-wrap items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    void addImageFiles(Array.from(e.target.files));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || syncState === "saving"}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-1.5"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                Insert image
              </Button>
              <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
                {(
                  [
                    ["story", "Write"],
                    ["preview", "Preview"],
                  ] as const
                ).map(([view, label]) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setEditorView(view)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      editorView === view
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {editorView === "story" && (
            <div className="rounded-lg border border-border/50 bg-muted/25 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/70">
              <span className="font-medium text-foreground/90">Markdown supported.</span>{" "}
              Use{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/90">
                **bold**
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/90">
                *italic*
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/90">
                # heading
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/90">
                - list
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/90">
                `code`
              </code>
              , links{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/90">
                [text](url)
              </code>
              . Open{" "}
              <span className="font-medium text-foreground/90">Preview</span> to
              check formatting. Images: paste, drop, or Insert image.
            </div>
          )}

          {editorView === "story" && (
            <EditorBody
              blocks={blocks}
              onChange={setBlocks}
              onPasteFiles={(files, afterId) => void addImageFiles(files, afterId)}
              onDropFiles={(files, afterId) => void addImageFiles(files, afterId)}
              onRemoveImage={handleRemoveImage}
              disabled={syncState === "saving"}
              isDragging={isDragging}
              onDragStateChange={setIsDragging}
              focusBlockRequest={focusBlockRequest}
              onFocusBlockHandled={() => setFocusBlockRequest(null)}
            />
          )}

          {editorView === "preview" && (
            <div className="min-h-[420px] rounded-xl border border-border bg-card p-6 prose-custom">
              <MarkdownPreview content={content} />
            </div>
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
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !tags.includes(tag) && tags.length < 5) {
                    setTags([...tags, tag]);
                    setTagInput("");
                  }
                }
              }}
              className="h-9 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const tag = tagInput.trim().toLowerCase();
                if (tag && !tags.includes(tag) && tags.length < 5) {
                  setTags([...tags, tag]);
                  setTagInput("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPublished(!published)}
              className={cn("gap-2", published && "text-primary")}
            >
              {published ? (
                <>
                  <Eye className="h-4 w-4" /> Will publish publicly
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" /> Save as draft only
                </>
              )}
            </Button>
            {postId && !published && (
              <DeleteDraftButton
                postId={postId}
                postTitle={title}
                redirectTo="/drafts"
              />
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => requestLeave(() => router.back())}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={
                publishing ||
                uploading ||
                syncState === "saving" ||
                blocks.some((b) => b.type === "image" && b.status === "uploading")
              }
              onClick={() => void handlePublish()}
              className="gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {published ? "Publishing…" : "Saving…"}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {published ? "Publish" : "Save draft"}
                </>
              )}
            </Button>
          </div>
        </div>
        </div>
      </div>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen} modal={false}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              Unsaved changes and new images will be lost. Your last autosaved
              version stays on the server if you already saved before.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                pendingLeaveRef.current = null;
                setLeaveDialogOpen(false);
              }}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={async () => {
                setLeaveDialogOpen(false);
                await discardAndLeave();
                pendingLeaveRef.current?.();
                pendingLeaveRef.current = null;
              }}
            >
              Discard changes
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setLeaveDialogOpen(false);
                await withLoading(async () => {
                  const ok = await persistToServer({
                    forcePublished: false,
                    createIfNeeded: true,
                  });
                  if (ok) {
                    skipLeaveGuardRef.current = true;
                    pendingLeaveRef.current?.();
                    pendingLeaveRef.current = null;
                  }
                }, "Saving draft…");
              }}
            >
              Save draft & leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
