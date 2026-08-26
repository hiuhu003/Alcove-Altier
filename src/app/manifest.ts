import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest. Most shoppers arrive on a phone, so this gives them a
 * proper name and brand colour when they add the store to their home screen,
 * and lets Lighthouse/PWA checks pass.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.shortDesc,
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F4",
    theme_color: "#2C2B30",
    lang: "en-KE",
    categories: ["shopping", "lifestyle"],
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
