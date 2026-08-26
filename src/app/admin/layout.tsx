import type { Metadata } from "next";

/**
 * The admin CMS must never be indexed. robots.txt already disallows /admin,
 * but that only asks crawlers not to *fetch* — this header/meta tells any
 * crawler that reaches a page anyway (a shared link, a stray backlink) to keep
 * it out of the index entirely.
 */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
