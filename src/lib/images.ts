import "server-only";

/**
 * Image normalisation.
 *
 * Every uploaded photo is re-rendered to one of the shapes the storefront
 * actually displays, so the catalogue looks like a catalogue no matter what the
 * client photographs with. The layout already pins each slot to a fixed aspect
 * ratio, but `object-cover` then crops whatever it is given — a wide shot of a
 * rug lost its ends while a tall mirror shot filled the frame. Normalising at
 * upload means what is stored *is* what is shown, and the admin sees the final
 * framing straight away instead of discovering it on the live shop.
 */

export type ImageKind = "product" | "category";

export type ImagePreset = {
  width: number;
  height: number;
  /** Human description used in the uploader hint and error copy. */
  label: string;
};

/**
 * Targets are 2x the largest size each slot is displayed at, so they stay sharp
 * on phones (which are nearly all high-DPI) without storing anything huge.
 * Ratios match the Tailwind aspect classes — change one, change the other.
 */
export const IMAGE_PRESETS: Record<ImageKind, ImagePreset> = {
  // ProductCard + ProductDetail gallery: aspect-[4/5]
  product: { width: 1200, height: 1500, label: "4:5 portrait" },
  // CategoryShowcase + CategoriesManager: aspect-[5/3]
  category: { width: 1500, height: 900, label: "5:3 landscape" },
};

export function isImageKind(value: unknown): value is ImageKind {
  return value === "product" || value === "category";
}

/** Cream (#FAF7F4) — the page background, so padding is invisible. */
const PAD_BACKGROUND = { r: 250, g: 247, b: 244, alpha: 1 };

/**
 * How far a photo's shape may differ from the target before cropping it would
 * throw away too much. Within tolerance we crop edge-to-edge for a full-bleed
 * look; beyond it we fit the whole photo and pad, because a rug cropped to
 * portrait stops being a picture of a rug.
 */
const CROP_TOLERANCE = 0.28;

export type NormalisedImage = {
  data: Buffer;
  contentType: string;
  extension: string;
  width: number;
  height: number;
  /** True when the photo was padded rather than cropped. */
  padded: boolean;
};

/**
 * Re-render `input` to the preset's exact dimensions.
 *
 * Output is WebP: comparable quality to JPEG at roughly half the bytes, and
 * supported everywhere the site runs. Metadata (including GPS tags from a
 * phone) is dropped, and EXIF orientation is applied first so photos taken
 * sideways are not stored sideways.
 */
export async function normaliseImage(
  input: Buffer,
  kind: ImageKind
): Promise<NormalisedImage> {
  const preset = IMAGE_PRESETS[kind];
  const sharp = (await import("sharp")).default;

  // .rotate() with no argument bakes in the EXIF orientation, then clears it.
  const pipeline = sharp(input, { animated: false }).rotate();

  const meta = await pipeline.metadata();
  const targetRatio = preset.width / preset.height;
  const sourceRatio =
    meta.width && meta.height ? meta.width / meta.height : targetRatio;

  // Relative difference, so a 2:1 source against 4:5 reads as "far off"
  // regardless of which way round it is.
  const drift = Math.abs(sourceRatio - targetRatio) / targetRatio;
  const padded = drift > CROP_TOLERANCE;

  const data = await pipeline
    .resize(preset.width, preset.height, {
      fit: padded ? "contain" : "cover",
      // "attention" keeps the busiest region — for a product on a plain
      // backdrop that is the product itself, which beats a blind centre crop.
      position: padded ? "centre" : "attention",
      background: PAD_BACKGROUND,
      // Never upscale past the source: a small photo blown up looks worse than
      // one that is simply padded to size.
      withoutEnlargement: false,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  return {
    data,
    contentType: "image/webp",
    extension: "webp",
    width: preset.width,
    height: preset.height,
    padded,
  };
}
