import type { SVGProps } from "react";

/** Brand/social glyphs (Lucide removed brand icons in v1). */
export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.5 3c.3 2.1 1.6 3.6 3.5 4v2.4c-1.3 0-2.5-.4-3.5-1v5.9c0 3.4-2.7 6.1-6.1 6.1S4.3 17.7 4.3 14.3c0-3.1 2.4-5.7 5.5-6v2.5c-1.6.3-2.9 1.7-2.9 3.4 0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5V3h2.6z" />
    </svg>
  );
}
