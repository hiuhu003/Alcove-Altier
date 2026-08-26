import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "dark" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-strong/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-coral to-pink-strong text-white shadow-lg shadow-pink-strong/25 hover:from-pink-strong hover:to-coral hover:-translate-y-0.5",
  dark: "bg-charcoal text-cream hover:bg-graphite hover:-translate-y-0.5",
  outline:
    "border border-charcoal/25 text-charcoal hover:border-pink-strong hover:bg-pink-strong hover:text-white",
  ghost: "text-charcoal hover:bg-pink-strong/10",
  whatsapp: "bg-[#25D366] text-white hover:brightness-95 hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-4 h-9 tracking-wide",
  md: "text-sm px-6 h-11 tracking-wide",
  lg: "text-sm px-8 h-[3.25rem] tracking-wider uppercase",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {props.children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  external,
  children,
  ...props
}: CommonProps & { href: string; external?: boolean } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className"
  >) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
