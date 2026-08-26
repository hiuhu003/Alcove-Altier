import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Push catalogue changes live immediately.
 *
 * The storefront is cached (ISR) so crawlers and shoppers get static-fast HTML.
 * That cache would otherwise hold stale content until the next revalidation
 * window, so every admin write that changes what the public sees calls this to
 * purge the affected pages at once.
 */
export function revalidateStorefront(productSlug?: string): void {
  try {
    revalidatePath("/"); // featured products
    revalidatePath("/shop"); // listing + filters
    revalidatePath("/sitemap.xml"); // search engines
    if (productSlug) revalidatePath(`/shop/${productSlug}`);
    else revalidatePath("/shop/[slug]", "page");
  } catch (err) {
    // Never fail an admin save because a cache purge hiccupped.
    console.error("[revalidate] failed:", err);
  }
}
