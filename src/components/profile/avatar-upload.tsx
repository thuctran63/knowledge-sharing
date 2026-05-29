"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
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
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOwner = session?.user?.id === userId;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      await update({ image: data.image });
      toast({ title: "Avatar updated", variant: "success" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const sizeClasses =
    size === "large" ? "h-24 w-24" : "h-10 w-10";

  return (
    <div className="relative inline-flex group">
      <Avatar className={cn(sizeClasses, "ring-4 ring-border")}>
        <AvatarImage src={image || ""} />
        <AvatarFallback
          className={cn(size === "large" && "text-2xl")}
        >
          {name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      {isOwner && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full",
              "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
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
  );
}
