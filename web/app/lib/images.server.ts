import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.server";

const MAX_IMAGE = 2 * 1024 * 1024;
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
const s3 = new S3Client({});

// Sniff the real type from the first bytes; the client file name and type are not trusted.
async function sniff(file: File): Promise<keyof typeof TYPES | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

// Returns the key under images/ (served by CloudFront at /images/<key>), or null when not an allowed image or too big.
export async function saveImage(file: File) {
  const ext = file.size <= MAX_IMAGE ? await sniff(file) : null;
  if (!ext) return null;
  const key = `products/${crypto.randomUUID()}.${ext}`;
  await s3.send(new PutObjectCommand({ Bucket: env.BUCKET, Key: `images/${key}`, Body: new Uint8Array(await file.arrayBuffer()), ContentType: TYPES[ext] }));
  return key;
}
