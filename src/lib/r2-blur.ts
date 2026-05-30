import "server-only";
import sharp from "sharp";

export async function generateBlurDataUrl(buffer: Buffer): Promise<string> {
  const blurred = await sharp(buffer)
    .resize(10, 10, { fit: "inside" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${blurred.toString("base64")}`;
}
