import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * `script-src` allows 'unsafe-inline' because Next injects inline bootstrap and
 * streaming scripts; locking that down needs nonces threaded through a proxy
 * (middleware), which is a bigger change than this site warrants. Everything
 * else is tight: no plugins, no framing, forms and connections restricted to
 * our own origin plus the services we actually call.
 */
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  [
    `connect-src 'self'`,
    supabaseHost,
    supabaseHost.replace("https://", "wss://"),
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://api.stripe.com",
  ]
    .filter(Boolean)
    .join(" "),
  // google.com/maps: the location embed on /contact.
  `frame-src https://www.google.com https://maps.google.com https://js.stripe.com https://www.paypal.com`,
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for 2 years, including subdomains (Vercel serves HTTPS only).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    // Remote image hosts. Supabase Storage serves the client's uploaded photos;
    // Unsplash/picsum remain for the seed catalogue's placeholders.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    qualities: [60, 75, 90],
    // Cache optimised images for a day instead of the 60s default.
    minimumCacheTTL: 86400,
    // Uploaded SVGs are never rendered through next/image (explicit default).
    dangerouslyAllowSVG: false,
  },
  typescript: { ignoreBuildErrors: false },
  // Don't advertise the framework version to attackers.
  poweredByHeader: false,
  compress: true,
  // Hide the Next.js dev indicator badge (compile/runtime errors still surface).
  devIndicators: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Admin and API responses must never be cached by a CDN or browser.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
