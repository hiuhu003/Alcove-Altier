import { NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/http";
import { MAX_UPLOAD_BYTES, storeImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts one product image and returns its public URL.
 * Storage target (Supabase bucket vs local disk) is decided in lib/storage.ts.
 */
export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  try {
    // Cheap pre-check before buffering the body into memory.
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES * 1.1) {
      return NextResponse.json(
        { ok: false, error: `Images must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
    }

    const result = await storeImage(file);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[upload] failed:", err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
