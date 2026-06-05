import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Dev-only disk storage when Cloudinary is not configured. */
export function isLocalUploadEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function safeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+/, "") || "misc";
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function saveLocalUpload(
  buffer: Buffer,
  mimeType: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const ext = extensionForMime(mimeType);
  const name = `${crypto.randomUUID()}.${ext}`;
  const relDir = path.posix.join("uploads", ...safeFolder(folder).split("/"));
  const absDir = path.join(process.cwd(), "public", ...relDir.split("/"));

  await fs.mkdir(absDir, { recursive: true });
  await fs.writeFile(path.join(absDir, name), buffer);

  const url = `/${relDir}/${name}`;
  return { url, publicId: `${relDir}/${name}` };
}
