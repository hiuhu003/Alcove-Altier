import "server-only";
import { randomBytes } from "crypto";
import { slugify } from "./utils";
import { normaliseImage, type ImageKind } from "./images";

/**
 * Product image storage.
 *
 * Production (Vercel) writes to a Supabase Storage bucket: serverless
 * filesystems are read-only and ephemeral, so uploads must leave the instance.
 * With the Supabase env vars unset we fall back to `public/uploads` on local
 * disk, which keeps `npm run dev` working with no cloud account.
 */

export const UPLOAD_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

/** Image types the admin uploader accepts (matches what next/image can serve). */
const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export type UploadResult =
  | { ok: true; url: string; width: number; height: number; padded: boolean }
  | { ok: false; error: string };

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Validate an uploaded file. The extension is derived from the *sniffed* MIME
 * type, never from the client-supplied filename, so a `.php`/`.svg` can't ride
 * in on a mislabelled upload (SVG is excluded deliberately — it can carry
 * script and would be served from our own origin).
 */
function validate(file: File): { ok: true } | { error: string } {
  if (!ALLOWED.has(file.type)) {
    return { error: "Please upload a JPG, PNG, WebP, AVIF or GIF image." };
  }
  if (file.size <= 0) return { error: "That file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `Images must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` };
  }
  return { ok: true };
}

/** A safe, collision-proof object name — no client-controlled path segments. */
function objectName(originalName: string, ext: string): string {
  const base = slugify(originalName.replace(/\.[^.]+$/, "")).slice(0, 60) || "image";
  return `${base}-${randomBytes(6).toString("hex")}.${ext}`;
}

export async function storeImage(
  file: File,
  kind: ImageKind = "product"
): Promise<UploadResult> {
  const checked = validate(file);
  if ("error" in checked) return { ok: false, error: checked.error };

  const original = Buffer.from(await file.arrayBuffer());

  // Re-render to the shape the storefront displays. Everything downstream then
  // deals with one predictable format.
  let image;
  try {
    image = await normaliseImage(original, kind);
  } catch (err) {
    console.error("[storage] could not process image:", err);
    return {
      ok: false,
      error: "That image couldn't be processed. Try a JPG or PNG exported from your photo app.",
    };
  }

  const name = objectName(file.name, image.extension);
  const stored = isSupabaseStorageConfigured()
    ? await uploadToSupabase(name, image.data, image.contentType)
    : await uploadToDisk(name, image.data);

  if (!stored.ok) return stored;
  return {
    ok: true,
    url: stored.url,
    width: image.width,
    height: image.height,
    padded: image.padded,
  };
}

type StoreResult = { ok: true; url: string } | { ok: false; error: string };

async function uploadToSupabase(
  name: string,
  bytes: Buffer,
  contentType: string
): Promise<StoreResult> {
  const { createClient } = await import("@supabase/supabase-js");
  // The service-role key bypasses row-level security, so it must never leave
  // the server — it is read here and nowhere else.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(name, bytes, { contentType, cacheControl: "31536000", upsert: false });

  if (error) {
    console.error("[storage] Supabase upload failed:", error.message);
    return { ok: false, error: "Upload failed. Please try again." };
  }

  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(name);
  return { ok: true, url: data.publicUrl };
}

async function uploadToDisk(name: string, bytes: Buffer): Promise<StoreResult> {
  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error:
        "Image storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or paste an image URL instead.",
    };
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { ok: true, url: `/uploads/${name}` };
}
