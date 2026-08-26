import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <Reveal>
          <p className="eyebrow mb-3">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={1}>
        <h2 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={2}>
          <p className="mt-4 text-lg leading-relaxed text-graphite">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
