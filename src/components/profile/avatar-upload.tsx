"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { prepareImageFile, MAX_AVATAR_SIZE } from "@/lib/image-upload";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  userId: string;
  image: string | null;
  name: string | null;
  size?: "default" | "large";
}

export function AvatarUpload({
  userId,
  image,
  name,
  size = "large",
}: AvatarUploadProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [currentImage, setCurrentImage] = useState(image);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const isOwner = session?.user?.id === userId;

  useEffect(() => {
    setCurrentImage(image);
  }, [image]);

  const displayImage = isOwner
    ? (session?.user?.image ?? currentImage)
    : currentImage;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;

    const prepared = prepareImageFile(raw, MAX_AVATAR_SIZE);
    if ("error" in prepared) {
      toast({
        title: "Invalid image",
        description: prepared.error,
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    fileRef.current = prepared.file;
    const url = URL.createObjectURL(prepared.file);
    setPreview(url);
    setOpen(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    const file = fileRef.current;
    if (!file) return;

    setUploading(true);

    try {
      const form = new FormData();
      form.append("avatar", file);

      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error);
      }

      const data = await res.json();
      setCurrentImage(data.image);
      await update({ image: data.image });
      router.refresh();
      toast({ title: "Avatar updated", variant: "success" });
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      fileRef.current = null;
    }
  };

  return (
    <>
      <div className="relative inline-flex group">
        <UserAvatar
          src={displayImage}
          name={name}
          size={size === "large" ? "lg" : "md"}
        />

        {isOwner && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,.gif,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full",
                "bg-black/40 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200",
                uploading && "opacity-100"
              )}
              aria-label="Upload avatar"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload avatar</DialogTitle>
            <DialogDescription>
              JPEG, PNG, WebP, or animated GIF (max 10MB)
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {preview && (
              <UserAvatar src={preview} name={name} size="lg" className="h-32 w-32 shadow-md" />
            )}
            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
              Shown as a circle across the site. GIFs stay animated.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                fileRef.current = null;
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
