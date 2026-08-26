"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string; // unique line id (product + variant)
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  bespoke: boolean;
  qty: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /** Whose cart this is: a user id, or null while signed out. */
  ownerId: string | null;
  add: (item: Omit<CartItem, "id" | "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Swap to the signed-in customer's cart (or back to the guest one). */
  switchOwner: (ownerId: string | null) => void;
};

const lineId = (i: { productId: string; color?: string; size?: string }) =>
  `${i.productId}::${i.color ?? "-"}::${i.size ?? "-"}`;

const STORAGE_KEY = "alcove-cart";

/**
 * Whose basket this is: the signed-in customer's email, or null for a guest.
 *
 * A single storage key holding the owner alongside the items, rather than a key
 * per account. The per-key version had an ordering hazard: on every page load
 * the store rehydrated as a guest before the session arrived, so the "merge the
 * guest basket in" step ran again and again and quietly doubled quantities.
 * Storing the owner makes the transition idempotent - the same input always
 * lands in the same state, however many times it runs.
 */
type Owner = string | null;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      ownerId: null,
      add: (item, qty = 1) =>
        set((state) => {
          const id = lineId(item);
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, qty: i.qty + qty } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { ...item, id, qty }], isOpen: true };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      switchOwner: (ownerId: Owner) => {
        const current = get().ownerId;
        if (current === ownerId) return;

        // Guest -> signed in: the basket comes with them. Items are already in
        // state, so this is a relabel, not a copy - it cannot duplicate.
        if (current === null && ownerId !== null) {
          set({ ownerId, isOpen: false });
          return;
        }

        // Signing out, or a different account on this browser: start empty, so
        // one person's basket is never handed to the next.
        set({ items: [], ownerId, isOpen: false });
      },
    }),
    {
      name: STORAGE_KEY,
      // The owner is persisted with the items: on the next page load the store
      // already knows whose basket this is, so nothing is re-merged.
      partialize: (state) => ({ items: state.items, ownerId: state.ownerId }),
    }
  )
);

/** Derived selectors (call with the store's items). */
export const cartCount = (items: CartItem[]) =>
  items.reduce((n, i) => n + i.qty, 0);
export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);
