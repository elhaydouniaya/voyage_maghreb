import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Local-disk avatar storage.
 *
 * Files are written under `public/uploads/avatars/` and served as
 * same-origin static assets (`/uploads/avatars/<file>`). The public API
 * (saveAvatar / deleteLocalAvatar) is storage-agnostic, so this module can be
 * swapped for S3 / Vercel Blob later without touching the route handlers.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const AVATAR_SUBDIR = path.join("uploads", "avatars");
const AVATAR_DIR = path.join(PUBLIC_DIR, AVATAR_SUBDIR);

/** Public URL prefix used both to build and to validate avatar paths. */
const AVATAR_URL_PREFIX = "/uploads/avatars/";

/** MIME types we accept for avatars, mapped to their canonical extension. */
export const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Hard ceiling on upload size (the client downscales to ~512px first). */
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 Mo

/**
 * Persist avatar bytes and return the public URL to store in `user.image`.
 * The filename is randomised so a new upload never collides with a cached one.
 */
export async function saveAvatar(
  userId: string,
  bytes: Buffer,
  ext: string
): Promise<string> {
  await mkdir(AVATAR_DIR, { recursive: true });
  const token = crypto.randomBytes(6).toString("hex");
  const filename = `${userId}-${token}.${ext}`;
  await writeFile(path.join(AVATAR_DIR, filename), bytes);
  return `${AVATAR_URL_PREFIX}${filename}`;
}

/**
 * Remove a previously-stored avatar from disk. No-ops for anything that is not
 * a file we own (e.g. Google profile URLs), and guards against path traversal.
 */
export async function deleteLocalAvatar(
  imageUrl: string | null | undefined
): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(AVATAR_URL_PREFIX)) return;

  const filename = path.basename(imageUrl);
  const filePath = path.join(AVATAR_DIR, filename);

  // Belt-and-braces: never unlink outside the avatars directory.
  if (path.dirname(filePath) !== AVATAR_DIR) return;

  try {
    await unlink(filePath);
  } catch {
    /* already gone — nothing to do */
  }
}