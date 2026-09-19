import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Payment-screenshot uploads.
 * - Production: signed Cloudinary upload into a PRIVATE folder (admin-only view).
 * - Sandbox/dev fallback: file persisted under ./uploads/payments and served
 *   through /api/payments/[file] (unguessable filename, no directory listing).
 * Either way, only the URL string is stored on the Payment row.
 */

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5MB

export function isAllowedImage(mime: string): boolean {
  return mime in ALLOWED_MIME;
}

function cloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

async function uploadToCloudinary(file: File, orderNo: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "fch/payment-screenshots";
  // params must be alphabetical in the signature
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${orderNo}-${timestamp}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("public_id", `${orderNo}-${timestamp}`);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error("Cloudinary upload returned no URL");
  return json.secure_url;
}

async function saveLocally(file: File, orderNo: string): Promise<string> {
  const ext = ALLOWED_MIME[file.type] ?? "jpg";
  const name = `${orderNo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "uploads", "payments");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/payments/${name}`;
}

/** Persist a payment screenshot; returns the URL to store on the Payment row. */
export async function savePaymentScreenshot(file: File, orderNo: string): Promise<string> {
  if (cloudinaryConfigured()) return uploadToCloudinary(file, orderNo);
  return saveLocally(file, orderNo);
}
