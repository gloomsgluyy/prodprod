/**
 * Storage abstraction for CoalTrade OS file uploads.
 * Provider: "local" — files stored in ./uploads/ relative to process.cwd().
 * Files are served via the /api/files/[...path] proxy route.
 *
 * When object storage (S3/R2/GCS) is configured in the future, swap the
 * implementation here without changing callers.
 */

import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

function safePath(objectKey: string): string {
  const root = path.resolve(UPLOAD_DIR);
  const target = path.resolve(root, objectKey);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage object key");
  return target;
}

/** Ensure a directory exists (recursive). */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Save a file buffer to local storage.
 * @param buffer - Raw file bytes
 * @param subdir - Subdirectory inside UPLOAD_DIR (e.g. "shipments", "si", "fco")
 * @param filename - Desired filename (sanitised internally)
 * @returns { objectKey, publicUrl }
 */
export async function saveFile(
  buffer: Buffer | Uint8Array,
  subdir: string,
  filename: string
): Promise<{ objectKey: string; publicUrl: string }> {
  const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, "_");
  const safeDir  = subdir.replace(/[^a-zA-Z0-9_\-/]/g, "_");

  const dir = path.join(UPLOAD_DIR, safeDir);
  ensureDir(dir);

  // Prevent collisions by prepending a timestamp prefix
  const ts = Date.now();
  const uniqueName = `${ts}_${safeName}`;
  const filePath   = path.join(dir, uniqueName);

  await fs.promises.writeFile(filePath, buffer);

  const objectKey = `${safeDir}/${uniqueName}`;
  const publicUrl = `/api/files/${objectKey}`;

  return { objectKey, publicUrl };
}

/**
 * Delete a file from local storage by objectKey.
 * Silently ignores ENOENT (already deleted).
 */
export async function deleteFile(objectKey: string): Promise<void> {
  const filePath = safePath(objectKey);
  try {
    await fs.promises.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

/**
 * Read a file from local storage by objectKey.
 * Returns null if the file does not exist.
 */
export async function readFile(
  objectKey: string
): Promise<{ buffer: Buffer; filePath: string } | null> {
  const filePath = safePath(objectKey);
  try {
    const buffer = await fs.promises.readFile(filePath);
    return { buffer, filePath };
  } catch {
    return null;
  }
}
