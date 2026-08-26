import { cn } from "@/lib/utils";

/**
 * Alcove Atelier monogram — an arched frame with an "A" and a sweeping swash,
 * echoing the brand's line-drawn logo. Uses currentColor so it inherits text
 * colour (charcoal on light, cream on dark).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      className={cn("h-10 w-auto", className)}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer arch */}
        <path d="M12 116 V54 a38 38 0 0 1 76 0 V116" />
        {/* Inner arch */}
        <path d="M24 116 V54 a26 26 0 0 1 52 0 V116" />
        {/* The 'A' */}
        <path d="M50 40 L34 100" />
        <path d="M50 40 L66 100" />
        {/* Swash crossbar sweeping through the A */}
        <path d="M30 84 C 46 74, 58 92, 74 78" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  stacked = false,
  showTagline = false,
}: {
  className?: string;
  stacked?: boolean;
  showTagline?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-charcoal",
        stacked && "flex-col gap-2",
        className
      )}
    >
      <LogoMark className={stacked ? "h-14" : "h-9"} />
      <span className={cn("flex flex-col", stacked && "items-center")}>
        <span className="font-serif text-2xl leading-none tracking-[0.12em]">
          ALCOVE
        </span>
        <span className="font-sans text-[0.62rem] font-semibold tracking-[0.42em] text-graphite">
          ATELIER
        </span>
        {showTagline && (
          <span className="mt-1 font-sans text-[0.55rem] tracking-[0.24em] text-graphite/70">
            CURATED DECOR · CREATIONS · ACCENTS
          </span>
        )}
      </span>
    </span>
  );
}
