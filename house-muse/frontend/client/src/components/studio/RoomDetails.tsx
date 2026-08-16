/*
 * HOUSE MUSE — Room details step
 * Style: "The Design Journal" — scrapbook page taped to the board.
 *
 *  · Room dimensions — three handwritten-paper inputs (L × W × H, metres)
 *    with a paper-tape look, no corporate form fields.
 *  · Budget scale — a torn-paper slider whose thumb is a pin; the tier
 *    labels read like margin notes in the handwritten voice.
 */
import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { WashiTape, Pin } from "@/components/aesthetic/Craft";
import { BUDGET_TIERS } from "@/lib/mockData";
import { cn } from "@/lib/utils";

/* Dimensions are stored internally in METRES (downstream code — wallCostFor,
 * scaleBudget — expects metres). The UI collects feet and converts both ways
 * so nothing outside this component needs to change. */
const M_PER_FT = 0.3048;
const metresToFeet = (m: string) => {
  const n = parseFloat(m);
  return isNaN(n) ? "" : (n / M_PER_FT).toFixed(1);
};
const feetToMetres = (ft: string) => {
  const n = parseFloat(ft);
  return isNaN(n) ? "" : (n * M_PER_FT).toFixed(2);
};

function PaperInput({
  label,
  value,
  onChange,
  unit = "ft",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-hand text-lg text-[var(--sienna)]">{label}</span>
      <div
        className="relative flex items-center rounded-[2px] bg-[var(--paper-cream)] px-3 py-2.5 paper-shadow-sm"
        style={{ rotate: "-0.5deg" }}
      >
        <input
          type="number"
          min={0}
          step={0.1}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          aria-label={label}
          className="font-display w-full bg-transparent text-lg font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <span className="font-hand text-base text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}

export interface RoomDetails {
  length: string;
  width: string;
  height: string;
  budget: number; // INR, user's total budget
}

export function RoomDetailsStep({
  details,
  onChange,
  onFinish,
}: {
  details: RoomDetails;
  onChange: (d: RoomDetails) => void;
  onFinish: () => void;
}) {
  const set = (key: keyof RoomDetails) => (value: string | number) =>
    onChange({ ...details, [key]: value });

  const budgetMin = BUDGET_TIERS[0].value;
  const budgetMax = BUDGET_TIERS[BUDGET_TIERS.length - 1].value;
  const nearestTier = BUDGET_TIERS.reduce((closest, t) =>
    Math.abs(t.value - details.budget) < Math.abs(closest.value - details.budget) ? t : closest
  );

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        className="relative rounded-sm bg-card p-6 paper-shadow sm:p-10"
        style={{ rotate: "0.4deg" }}
      >
        <WashiTape rotation={9} width="3.6rem" height="1rem" className="-top-2.5 left-10" />
        <WashiTape
          color="var(--sage)"
          rotation={-11}
          width="3.6rem"
          height="1rem"
          className="-top-2.5 right-10"
        />
        <Pin color="var(--sage)" className="top-1/2 -left-1.5 -translate-y-1/2" />

        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          how big is this dream?
        </h2>
        <p className="font-hand mt-1 text-xl text-[var(--terracotta)]">
          dimensions first — then money talk ↓
        </p>

        {/* dimensions */}
        <div className="mt-6 flex items-end gap-3">
          <div className="flex-1">
            <PaperInput
              label="length"
              value={metresToFeet(details.length)}
              onChange={(ft) => set("length")(feetToMetres(ft))}
            />
          </div>
          <span
            className="font-hand pb-3 text-xl text-[var(--terracotta)]"
            aria-hidden
            style={{ rotate: "-4deg" }}
          >
            ×
          </span>
          <div className="flex-1">
            <PaperInput
              label="width"
              value={metresToFeet(details.width)}
              onChange={(ft) => set("width")(feetToMetres(ft))}
            />
          </div>
          <span
            className="font-hand pb-3 text-xl text-[var(--terracotta)]"
            aria-hidden
            style={{ rotate: "4deg" }}
          >
            ×
          </span>
          <div className="flex-1">
            <PaperInput
              label="height"
              value={metresToFeet(details.height)}
              onChange={(ft) => set("height")(feetToMetres(ft))}
            />
          </div>
        </div>
        <p className="font-hand mt-2 flex items-center gap-1.5 text-lg text-[var(--sienna)]">
          <Ruler size={15} className="text-[var(--terracotta)]" />
          feet — a guess is fine, the muse is forgiving.
        </p>

        {/* divider */}
        <div
          aria-hidden
          className="my-6 border-t border-dashed border-border"
          style={{ rotate: "-0.3deg" }}
        />

        {/* budget scale */}
        <h3 className="font-display text-lg font-bold">
          the money talk
        </h3>
        <p className="font-hand text-lg text-[var(--terracotta)]">
          drag the slider — the muse plans around it
        </p>

        <div className="mt-5">
          <input
            type="range"
            min={budgetMin}
            max={budgetMax}
            step={5000}
            value={details.budget}
            onChange={(e) => set("budget")(Number(e.target.value))}
            aria-label="total budget in rupees"
            className="budget-slider w-full"
          />
          <div className="relative mt-2 h-8" aria-hidden>
            {BUDGET_TIERS.map((t) => {
              const pct = ((t.value - budgetMin) / (budgetMax - budgetMin)) * 100;
              // clamp so end labels don't overflow past the track edges
              const clamped = Math.min(96, Math.max(4, pct));
              return (
                <span
                  key={t.value}
                  className={cn(
                    "font-hand absolute top-0 -translate-x-1/2 whitespace-nowrap text-center text-sm transition-colors",
                    t.value === nearestTier.value
                      ? "font-bold text-[var(--terracotta)]"
                      : "text-muted-foreground/70"
                  )}
                  style={{ left: `${clamped}%` }}
                >
                  {t.label}
                </span>
              );
            })}
          </div>

          <label className="mt-5 flex flex-col gap-1">
            <span className="font-hand text-lg text-[var(--sienna)]">
              or type the exact amount
            </span>
            <div
              className="relative flex items-center rounded-[2px] bg-[var(--paper-cream)] px-3 py-2.5 paper-shadow-sm"
              style={{ rotate: "0.5deg" }}
            >
              <span className="font-hand mr-1 text-base text-muted-foreground">₹</span>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={details.budget}
                onChange={(e) => set("budget")(Number(e.target.value) || 0)}
                aria-label="exact budget in rupees"
                className="font-display w-full bg-transparent text-lg font-bold text-foreground focus:outline-none"
              />
            </div>
          </label>

          <p className="font-hand mt-3 text-center text-xl text-[var(--terracotta)]">
            “₹{details.budget.toLocaleString("en-IN")}” — noted, pencil side down
          </p>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onFinish}
            className="font-sans relative inline-flex items-center gap-2 rounded-sm bg-[var(--terracotta)] px-7 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ rotate: "-0.7deg", boxShadow: "3px 4px 0 var(--sienna)" }}
          >
            dream it now →
          </button>
        </div>
      </div>
    </div>
  );
}
