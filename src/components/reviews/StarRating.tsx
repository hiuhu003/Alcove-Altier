"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating — read-only for display, interactive for leaving one.
 *
 * The interactive version is a real radio group rather than a row of buttons,
 * so it can be reached and set with the keyboard and is announced correctly by
 * screen readers.
 */
export function StarRating({
  value,
  size = "md",
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(px, n <= Math.round(value) ? "fill-coral text-coral" : "text-charcoal/20")}
        />
      ))}
    </span>
  );
}

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export function StarPicker({
  name,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <fieldset
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        disabled={disabled}
      >
        <legend className="sr-only">Your rating</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            onMouseEnter={() => setHover(n)}
            className={cn("cursor-pointer p-0.5", disabled && "cursor-default")}
            title={LABELS[n]}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              disabled={disabled}
              className="peer sr-only"
            />
            <Star
              className={cn(
                "h-8 w-8 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-pink-strong peer-focus-visible:ring-offset-2 rounded",
                n <= shown ? "fill-coral text-coral scale-105" : "text-charcoal/25"
              )}
            />
            <span className="sr-only">
              {n} star{n === 1 ? "" : "s"} — {LABELS[n]}
            </span>
          </label>
        ))}
      </fieldset>
      <span className="text-sm text-graphite" aria-live="polite">
        {shown ? LABELS[shown] : "Tap a star"}
      </span>
    </div>
  );
}
