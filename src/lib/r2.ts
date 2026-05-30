import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "knowledge-sharing";
const publicUrlBase = process.env.R2_PUBLIC_URL || "";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export type UploadResult = {
  url: string;
  key: string;
  blurDataURL?: string;
};

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function sanitizeExt(filename: string, fallback = "bin") {
  const ext = filename.split(".").pop()?.toLowerCase() || fallback;
  return ext.replace(/[^a-z0-9]/g, "") || fallback;
}

export function makePublicUrl(key: string): string {
  if (publicUrlBase) {
    return `${publicUrlBase.replace(/\/$/, "")}/${key}`;
  }
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

/** avatars/{userId}/{timestamp}.{ext} */
export function avatarObjectKey(userId: string, filename: string) {
  return `avatars/${userId}/${randomSuffix()}.${sanitizeExt(filename)}`;
}

/** posts/{postId}/{timestamp}.{ext} */
export function postImageObjectKey(postId: string, filename: string) {
  return `posts/${postId}/${randomSuffix()}.${sanitizeExt(filename)}`;
}

export function postImagesPrefix(postId: string) {
  return `posts/${postId}/`;
}

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<UploadResult> {
  await S3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  let blurDataURL: string | undefined;
  try {
    const { generateBlurDataUrl } = await import("@/lib/r2-blur");
    blurDataURL = await generateBlurDataUrl(body);
  } catch {
    blurDataURL = undefined;
  }

  return { url: makePublicUrl(key), key, blurDataURL };
}

export async function uploadFileToKey(
  file: File,
  key: string
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadBuffer(key, buffer, file.type || "application/octet-stream");
}

export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadFileToKey(file, avatarObjectKey(userId, file.name));
}

export async function uploadPostImage(
  file: File,
  postId: string
): Promise<UploadResult> {
  return uploadFileToKey(file, postImageObjectKey(postId, file.name));
}

/** @deprecated Use uploadUserAvatar or uploadPostImage */
export async function uploadFile(
  file: File,
  folder: string = "posts"
): Promise<UploadResult> {
  const ext = sanitizeExt(file.name);
  const key = `${folder}/${randomSuffix()}.${ext}`;
  return uploadFileToKey(file, key);
}

export async function deleteFile(key: string): Promise<void> {
  await S3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export async function deletePrefix(prefix: string): Promise<void> {
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  let continuationToken: string | undefined;

  do {
    const list = await S3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: normalized,
        ContinuationToken: continuationToken,
      })
    );

    const keys =
      list.Contents?.map((o) => o.Key).filter((k): k is string => !!k) ?? [];

    if (keys.length > 0) {
      await S3.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
          },
        })
      );
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);
}

export async function deletePostImages(postId: string): Promise<void> {
  await deletePrefix(postImagesPrefix(postId));
}

/** Extract R2 object key from a public URL we generated, or null if external (e.g. Google). */
export function getKeyFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    if (publicUrlBase) {
      const base = publicUrlBase.replace(/\/$/, "");
      if (url.startsWith(`${base}/`)) {
        return decodeURIComponent(url.slice(base.length + 1));
      }
    }

    const storageHost = `${bucketName}.${accountId}.r2.cloudflarestorage.com`;
    const parsed = new URL(url);
    if (parsed.hostname === storageHost) {
      return decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    }
  } catch {
    return null;
  }

  return null;
}

export async function deleteFileByUrl(url: string): Promise<void> {
  const key = getKeyFromUrl(url);
  if (!key) return;
  await deleteFile(key);
}

import { extractMarkdownImageUrls } from "@/lib/markdown-images";

export { extractMarkdownImageUrls };

/** Remove R2 images in posts/{postId}/ that are no longer referenced in content. */
export async function cleanupOrphanPostImages(
  postId: string,
  newContent: string,
  oldContent?: string
): Promise<void> {
  if (!oldContent) return;

  const prefix = postImagesPrefix(postId);
  const oldUrls = extractMarkdownImageUrls(oldContent);
  const newUrls = new Set(extractMarkdownImageUrls(newContent));

  for (const url of oldUrls) {
    if (newUrls.has(url)) continue;
    const key = getKeyFromUrl(url);
    if (key?.startsWith(prefix)) {
      try {
        await deleteFile(key);
      } catch {
        const { queueR2Deletion } = await import("@/services/upload.service");
        await queueR2Deletion(key).catch(() => undefined);
      }
    }
  }
}

export async function getSignedFileUrl(
  key: string,
  expiresIn = 86400
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(S3, command, { expiresIn });
}

export function publicUrl(key: string): string {
  return makePublicUrl(key);
}
