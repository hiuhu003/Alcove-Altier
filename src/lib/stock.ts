/**
 * Stock rules shared by the storefront, the admin UI and the alert engine.
 * Client-safe (no server-only imports) so the products table can use it too.
 */

/** A stocked product at or below this many units is flagged for restocking. */
export const LOW_STOCK_THRESHOLD = 3;

export type StockState = "bespoke" | "out" | "low" | "ok";

export function stockState(p: { inStock: number; bespoke: boolean }): StockState {
  if (p.bespoke) return "bespoke"; // made to order — nothing to run out of
  if (p.inStock <= 0) return "out";
  if (p.inStock <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

/** Filters used by the admin products table (`/admin/products?stock=…`). */
export type StockFilter = "all" | "low" | "out";

export function matchesStockFilter(
  p: { inStock: number; bespoke: boolean },
  filter: StockFilter
): boolean {
  if (filter === "all") return true;
  const state = stockState(p);
  // "low" is the restock list, so it includes anything already at zero.
  return filter === "out" ? state === "out" : state === "low" || state === "out";
}

export function parseStockFilter(value: string | string[] | undefined): StockFilter {
  return value === "low" || value === "out" ? value : "all";
}
