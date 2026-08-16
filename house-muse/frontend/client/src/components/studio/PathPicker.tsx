/*
 * HOUSE MUSE — PathPicker
 * Step 1 of the Studio: choose the design path before anything else.
 * "The Design Journal": hand-taped cards at slight rotations, warm paper,
 * handwritten captions. Content/data change, not a redesign.
 */
import { motion } from "framer-motion";
import { DESIGN_PATHS } from "@/lib/designData";
import type { DesignPathId } from "@/lib/mockData";
import { WashiTape } from "@/components/aesthetic/Craft";
import { Check } from "lucide-react";

export default function PathPicker({
  selected,
  onChange,
  onFinish,
}: {
  selected: DesignPathId;
  onChange: (p: DesignPathId) => void;
  onFinish: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="relative mx-auto w-full max-w-2xl rounded-sm bg-[var(--paper)] px-6 py-8 sm:px-10 paper-shadow"
      >
        <WashiTape className="left-6 -top-3 w-16 rotate-[-4deg]" color="sienna" />
        <WashiTape className="right-8 -top-3 w-14 rotate-[3deg]" color="sage" />

        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          what are we dreaming?
        </h2>
        <p className="mt-1 font-handwriting text-lg text-muted-foreground">
          pick the road — the muse stays on it ↓
        </p>

        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {DESIGN_PATHS.map((path, i) => {
            const active = selected === path.pathId;
            return (
              <button
                key={path.pathId}
                onClick={() => onChange(path.pathId as DesignPathId)}
                className={`group relative rounded-sm border-2 p-3 text-left transition-colors ${
                  active
                    ? "border-[var(--sienna)] bg-paper-warm"
                    : "border-transparent bg-paper hover:border-[var(--sienna)]/40"
                }`}
                style={{ transform: `rotate(${[-1.2, 1.1, -0.8][i]}deg)` }}
                aria-pressed={active}
              >
                <div className="relative overflow-hidden rounded-sm">
                  <img
                    src={path.image}
                    alt={path.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-x-0 bottom-0 flex items-center justify-center py-1 font-handwriting text-sm ${
                      active ? "bg-[var(--sienna)] text-[var(--paper)]" : "bg-paper/80 text-foreground/80"
                    }`}
                  >
                    <Check
                      className={`mr-1 h-3.5 w-3.5 transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                    />
                    {active ? "picked" : path.name}
                  </div>
                </div>
                <p className="mt-2 font-display text-base font-bold">{path.name}</p>
                <p className="font-handwriting text-sm text-muted-foreground">{path.blurb}</p>
                <p className="mt-2 border-t border-dashed border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {path.includes.join(" · ")}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center font-handwriting text-base text-muted-foreground">
          any road — she leads with the same honesty.
        </p>

        <div className="mt-5 flex justify-center">
          <button
            onClick={onFinish}
            className="btn-paper px-7 py-2.5 font-display text-sm font-semibold"
          >
            next — pin the room →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
