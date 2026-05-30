const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/** Normalize file type from extension when the browser omits MIME (common on mobile). */
export function normalizeUploadedImageFile(file: File): File | null {
  if (file.size === 0) return null;

  if (file.type.startsWith("image/")) {
    return ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
      ? file
      : null;
  }

  const ext = file.name?.match(/\.(\w+)$/)?.[1]?.toLowerCase();
  const type = ext && TYPE_BY_EXT[ext];
  if (!type) return null;

  const name =
    file.name && file.name.includes(".")
      ? file.name
      : `upload-${Date.now()}.${ext}`;

  return new File([file], name, { type });
}

/** Clipboard paste (esp. Windows screenshots) often yields File with empty type. */
export function normalizePastedImageFile(file: File): File | null {
  const normalized = normalizeUploadedImageFile(file);
  if (normalized) return normalized;

  if (file.size === 0) return null;

  const name =
    file.name && file.name.includes(".")
      ? file.name
      : `pasted-${Date.now()}.png`;

  return new File([file], name, { type: "image/png" });
}

export function prepareImageFile(
  file: File,
  maxSize = MAX_IMAGE_SIZE
): { file: File } | { error: string } {
  const normalized = normalizeUploadedImageFile(file);
  if (!normalized) {
    return {
      error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
    };
  }
  if (normalized.size > maxSize) {
    return {
      error: `File too large (max ${Math.round(maxSize / (1024 * 1024))}MB)`,
    };
  }
  return { file: normalized };
}

export function getClipboardImageFiles(data: DataTransfer | null): File[] {
  if (!data) return [];

  const seen = new Set<File>();
  const result: File[] = [];

  const push = (file: File | null) => {
    if (!file || seen.has(file)) return;
    seen.add(file);
    const normalized = normalizePastedImageFile(file);
    if (normalized) result.push(normalized);
  };

  if (data.files?.length) {
    for (const file of Array.from(data.files)) push(file);
  }

  if (data.items?.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind === "file") push(item.getAsFile());
    }
  }

  return result;
}

export function validateImageFile(
  file: File,
  maxSize = MAX_IMAGE_SIZE
): string | null {
  const prepared = prepareImageFile(file, maxSize);
  return "error" in prepared ? prepared.error : null;
}

export function validateImageFileOrNormalize(
  file: File,
  maxSize = MAX_IMAGE_SIZE
): { file: File } | { error: string } {
  return prepareImageFile(file, maxSize);
}
