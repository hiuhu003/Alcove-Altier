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
  add: (item: Omit<CartItem, "id" | "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const lineId = (i: { productId: string; color?: string; size?: string }) =>
  `${i.productId}::${i.color ?? "-"}::${i.size ?? "-"}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
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
    }),
    { name: "alcove-cart" }
  )
);

/** Derived selectors (call with the store's items). */
export const cartCount = (items: CartItem[]) =>
  items.reduce((n, i) => n + i.qty, 0);
export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);
