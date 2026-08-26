"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

/** Clears the cart on mount (used after redirect-based payment success). */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
