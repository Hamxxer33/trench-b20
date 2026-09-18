import { LOGO_BUCKET, MAX_LOGO_BYTES } from "@/lib/server/env";
import { handleError, ok, rateLimit } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { BadRequest } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Raster + svg, matched on sniffed bytes rather than the browser's say-so. */
const TYPES: Record<string, { ext: string; sniff: (b: Uint8Array) => boolean }> = {
  "image/png": { ext: "png", sniff: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { ext: "jpg", sniff: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/gif": { ext: "gif", sniff: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  "image/webp": {
    ext: "webp",
    sniff: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
};

/**
 * POST /api/upload — multipart form with one `file` field.
 *
 * The bucket is written with the service key so the public anon key no longer
 * needs storage insert rights. SVG is refused outright: it executes script in
 * an <img> on some surfaces and this bucket is public.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, "upload", 10, 60_000);
    if (limited) return limited;

    const form = await req.formData().catch(() => {
      throw new BadRequest("Expected a multipart form");
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new BadRequest("Attach a file");
    if (file.size === 0) throw new BadRequest("File is empty");
    if (file.size > MAX_LOGO_BYTES) {
      throw new BadRequest(`Keep it under ${Math.floor(MAX_LOGO_BYTES / 1024 / 1024)}MB`);
    }

    const spec = TYPES[file.type];
    if (!spec) {
      // Name the format we got. Phones are the common case here and an iPhone
      // hands over HEIC, which a bare "PNG, JPEG, GIF or WebP only" does not
      // help anyone act on.
      const heic = /heic|heif/i.test(file.type);
      throw new BadRequest(
        `${file.type || "That file"} is not a supported image — use PNG, JPEG, GIF or WebP.` +
          (heic
            ? " iPhone photos save as HEIC: set Settings → Camera → Formats to Most Compatible, or screenshot the image and upload that."
            : ""),
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!spec.sniff(bytes)) throw new BadRequest(`That file is not really ${file.type}`);

    const path = `${Date.now()}-${crypto.randomUUID()}.${spec.ext}`;
    const sb = supabaseAdmin();

    const { error } = await sb.storage.from(LOGO_BUCKET).upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;

    const { data } = sb.storage.from(LOGO_BUCKET).getPublicUrl(path);
    return ok({ url: data.publicUrl, path });
  } catch (e) {
    return handleError(e);
  }
}
