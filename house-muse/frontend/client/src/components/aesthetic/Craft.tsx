/*
 * HOUSE MUSE — craft primitives
 * "The Design Journal": washi tape strips, thumb pins, hand-drawn doodles
 * (stars / hearts / squiggles), torn-paper dividers, hand-drawn confidence
 * badge (NOT a progress bar), handwritten price tag.
 * Every element reads as placed by hand: slight rotations, paper textures.
 */
import { cn } from "@/lib/utils";

/* ---------- Washi tape strip ---------- */
export function WashiTape({
  color = "var(--terracotta)",
  rotation = -8,
  width = "4.5rem",
  height = "1.15rem",
  className,
  style,
}: {
  color?: string;
  rotation?: number;
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("absolute z-10 washi-tape", className)}
      style={{
        width,
        height,
        rotate: `${rotation}deg`,
        background: color,
        opacity: 0.55,
        boxShadow: "0 1px 3px rgba(45,30,15,0.15)",
        ...style,
      }}
    />
  );
}

/* ---------- Thumb pin ---------- */
export function Pin({
  color = "var(--terracotta)",
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2",
        className
      )}
    >
      <span
        className="block h-3.5 w-3.5 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${color} 0%, color-mix(in oklch, ${color} 55%, black) 100%)`,
          boxShadow: "0 1px 3px rgba(45,30,15,0.35), inset 0 -1px 2px rgba(0,0,0,0.25)",
        }}
      />
      <span className="absolute left-1/2 top-full h-1.5 w-px -translate-x-1/2 bg-black/20" />
    </span>
  );
}

/* ---------- Hand-drawn doodles ---------- */
export function DoodleStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2 C12.8 6 14 7.2 18 8 C14 8.8 12.8 10 12 14 C11.2 10 10 8.8 6 8 C10 7.2 11.2 6 12 2 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 20 C8 16.5 4 13.5 4 9.5 C4 7 5.8 5.5 7.8 5.5 C9.6 5.5 11 6.6 12 8 C13 6.6 14.4 5.5 16.2 5.5 C18.2 5.5 20 7 20 9.5 C20 13.5 16 16.5 12 20 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" fill="none" className={className} aria-hidden>
      <path
        d="M20 58 C20 58 19 40 19 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M19 46 C14 43 11 39 11 35 C14 36 17 38 19 41 Z" fill="currentColor" opacity="0.7" />
      <path d="M19 37 C24 34 27 30 27 26 C24 28 21 31 19 34 Z" fill="currentColor" opacity="0.55" />
      <path d="M19 30 C14 27 12 23 13 19 C16 21 18 24 19 27 Z" fill="currentColor" opacity="0.7" />
      <path d="M19 26 C22 23 23 19 21 16 C20 20 19 23 19 25 Z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/* ---------- Torn paper divider ---------- */
export function TornDivider({
  flip = false,
  className,
  paper = "var(--paper)",
}: {
  flip?: boolean;
  className?: string;
  paper?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("h-3 w-full overflow-visible", flip && "rotate-180", className)}
      style={{
        background: paper,
        clipPath:
          "polygon(0% 40%, 2% 90%, 5% 30%, 8% 85%, 12% 45%, 15% 95%, 19% 35%, 23% 80%, 27% 50%, 31% 95%, 35% 30%, 39% 85%, 43% 55%, 47% 90%, 51% 40%, 55% 95%, 59% 50%, 63% 85%, 67% 35%, 71% 90%, 75% 55%, 79% 95%, 83% 40%, 87% 80%, 91% 45%, 95% 85%, 98% 55%, 100% 90%, 100% 100%, 0% 100%)",
      }}
    />
  );
}

/* ---------- Hand-drawn confidence badge (not a progress bar) ---------- */
export function ConfidenceBadge({
  value, // 0-100
  note,
  className,
}: {
  value: number;
  note?: string;
  className?: string;
}) {
  // Hand-drawn circle with the number scribbled inside, rotation like a sticker
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ rotate: "-4deg" }}
    >
      <svg viewBox="0 0 100 100" className="h-16 w-16 sm:h-20 sm:w-20" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="var(--terracotta)"
          strokeWidth="2.5"
          strokeDasharray="280"
          strokeDashoffset={280 - (280 * Math.min(value, 100)) / 100}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          opacity="0.9"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 5"
          opacity="0.3"
        />
      </svg>
      <span className="font-hand absolute text-2xl font-bold text-[var(--terracotta)] sm:text-3xl">
        {value}%
      </span>
      {note && (
        <span className="absolute -bottom-5 left-1/2 w-max -translate-x-1/2 whitespace-nowrap font-hand text-sm text-[var(--sienna)]">
          {note}
        </span>
      )}
    </div>
  );
}

/* ---------- Handwritten price tag ---------- */
export function PriceTag({
  price,
  rotation = 3,
  className,
}: {
  price: number;
  rotation?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-hand relative inline-block bg-card px-3 py-1 text-xl text-[var(--sienna)] paper-shadow",
        className
      )}
      style={{ rotate: `${rotation}deg`, border: "1px dashed var(--clay)" }}
    >
      <span
        aria-hidden
        className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--terracotta)]"
        style={{ boxShadow: "inset 0 0 2px rgba(0,0,0,0.3)" }}
      />
      ₹{price.toLocaleString("en-IN")}
    </span>
  );
}

/* ---------- Corner botanical sprig ---------- */
export function CornerSprig({ className }: { className?: string }) {
  return <DoodleSprig className={cn("pointer-events-none text-[var(--sage)]", className)} />;
}
