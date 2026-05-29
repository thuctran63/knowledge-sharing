import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
};

function makePublicUrl(key: string): string {
  if (publicUrlBase) {
    return `${publicUrlBase.replace(/\/$/, "")}/${key}`;
  }
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

export async function uploadFile(
  file: File,
  folder: string = "posts"
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() || "bin";
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await S3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return { url: makePublicUrl(key), key };
}

export async function deleteFile(key: string): Promise<void> {
  await S3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export async function getSignedFileUrl(key: string, expiresIn = 86400): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(S3, command, { expiresIn });
}

export function publicUrl(key: string): string {
  return makePublicUrl(key);
}
