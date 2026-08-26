import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const host = new URL(SITE.url).host;

  // Preview/branch deployments must never be indexed — they would compete
  // with the real domain for the same content. Vercel sets VERCEL_ENV at build.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/checkout",
          "/checkout/",
          "/api/",
          "/uploads/", // raw dev uploads, not part of the catalogue
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host,
  };
}
