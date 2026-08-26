"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image with a graceful fallback. If the primary source fails (e.g. an
 * external placeholder is unavailable), it swaps to a deterministic photo so
 * the layout never shows a broken image. The client's own uploads replace
 * these before launch.
 */
export function SafeImage({
  src,
  alt,
  fallbackSeed,
  ...rest
}: ImageProps & { fallbackSeed?: string }) {
  const seed = encodeURIComponent(fallbackSeed || String(alt) || "alcove");
  const fallback = `https://picsum.photos/seed/alcove-${seed}/1100/1300`;
  const [current, setCurrent] = useState<string>(String(src));

  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
