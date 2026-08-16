/*
 * HOUSE MUSE — Budget breakdown
 * Style: "The Design Journal" — a torn-paper ledger taped beside the
 * reimagined polaroids, styled after a proper budget dashboard but
 * rendered entirely in the scrapbook voice (handwritten labels, tape,
 * pin-held donut, no corporate progress bars).
 *
 * All figures are INR (₹), formatted in the Indian numbering style.
 */
import { motion } from "framer-motion";
import { WashiTape, Pin } from "@/components/aesthetic/Craft";
import type { BudgetBreakdown as BudgetBreakdownType } from "@/lib/mockData";

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/* Hand-placed SVG donut with animated segment draw-in */
function BudgetDonut({ breakdown }: { breakdown: BudgetBreakdownType }) {
  const total = breakdown.categories.reduce((s, c) => s + c.amount, 0);
  const size = 180;
  const stroke = 30;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
      aria-label={`Budget allocation donut, total ${fmtINR(total)}`}
    >
      {breakdown.categories.map((c, i) => {
        const share = c.amount / total;
        const dash = circumference * share;
        const currentOffset = offset;
        offset += dash;
        return (
          <motion.circle
            key={c.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={c.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="butt"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.23, 1, 0.32, 1] }}
            style={{ rotate: "-90deg", transformOrigin: "50% 50%" }}
          />
        );
      })}
      {/* center label */}
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        className="fill-foreground"
        fontSize="17"
        fontWeight="700"
        fontFamily="Fraunces, serif"
      >
        {fmtINR(total)}
      </text>
      <text
        x="50%"
        y="58%"
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="8.5"
        fontWeight="600"
        letterSpacing="0.12em"
        fontFamily="'Nunito Sans', sans-serif"
      >
        ESTIMATED TOTAL
      </text>
    </svg>
  );
}

export function BudgetBreakdown({
  breakdown,
  roomLabel,
  dims,
}: {
  breakdown: BudgetBreakdownType;
  roomLabel: string;
  dims: { length: number | string; width: number | string; height: number | string };
}) {
  const total = breakdown.categories.reduce((s, c) => s + c.amount, 0);
  const savings = Math.max(0, breakdown.savedFrom - total);
  const saved = savings > 0;

  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-3xl rounded-sm bg-card p-5 paper-shadow sm:p-8"
      style={{ rotate: "-0.6deg" }}
    >
      <WashiTape rotation={-6} width="3.4rem" height="0.95rem" className="-top-2.5 left-10" />
      <WashiTape
        color="var(--sage)"
        rotation={8}
        width="3.4rem"
        height="0.95rem"
        className="-top-2.5 right-10"
      />
      <Pin className="left-6 top-3" color="var(--terracotta)" />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-bold">
          the money talk — {roomLabel}
        </h3>
        <p className="font-hand text-lg text-[var(--terracotta)]">
          {dims.length || dims.width
            ? `${dims.length || "–"}m × ${dims.width || "–"}m`
            : "pencil estimates, honest ones"}
        </p>
      </div>

      <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        {/* donut */}
        <motion.div
          className="relative mx-auto"
          style={{ rotate: "1deg" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="rounded-full bg-[var(--paper-cream)] p-5 paper-shadow-sm">
            <BudgetDonut breakdown={breakdown} />
          </div>
          <span className="font-hand absolute -bottom-4 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap text-[var(--sienna)]">
            budget allocation
          </span>
        </motion.div>

        {/* category ledger */}
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            category breakdown
          </p>
          <ul className="mt-3 divide-y divide-border/70">
            {breakdown.categories.map((c, i) => (
              <motion.li
                key={c.label}
                className="flex items-center gap-3 py-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.3 }}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <span className="font-sans flex-1 text-sm font-medium">{c.label}</span>
                <span className="font-display text-sm font-bold tabular-nums">
                  {fmtINR(c.amount)}
                </span>
              </motion.li>
            ))}
          </ul>

          <div
            aria-hidden
            className="mt-3 border-t border-dashed border-border"
            style={{ rotate: "-0.3deg" }}
          />

          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              total estimate
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-[var(--terracotta)]">
              {fmtINR(total)}
            </span>
          </div>
          <p className="font-hand mt-1 text-right text-lg text-[var(--sienna)]">
            {saved
              ? `you save ${fmtINR(savings)} from your total budget ✦`
              : "a splurge mood — own it ✦"}
          </p>
        </div>
      </div>
    </div>
  );
}
