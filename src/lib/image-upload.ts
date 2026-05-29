const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** Clipboard paste (esp. Windows screenshots) often yields File with empty type. */
export function normalizePastedImageFile(file: File): File | null {
  if (file.size === 0) return null;

  if (file.type.startsWith("image/")) {
    return ALLOWED_IMAGE_TYPES.includes(file.type) ? file : null;
  }

  const ext = file.name?.match(/\.(\w+)$/)?.[1]?.toLowerCase();
  const typeByExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  const type = (ext && typeByExt[ext]) || "image/png";
  const name =
    file.name && file.name.includes(".")
      ? file.name
      : `pasted-${Date.now()}.png`;

  return new File([file], name, { type });
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

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed: JPEG, PNG, GIF, WebP";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "File too large (max 10MB)";
  }
  return null;
}
