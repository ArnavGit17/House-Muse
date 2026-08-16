/*
 * HOUSE MUSE — ColourPalette
 * Recommended palette for the chosen trained style, rendered as hand-taped
 * paint chips with handwritten role captions — a scrapbook page detail,
 * not a widget. Shows wall-cost guidance (paint vs wallpaper) per path.
 */
import { paletteForStyle, type StylePalette, wallCostFor } from "@/lib/designData";
import { WashiTape } from "@/components/aesthetic/Craft";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ColourPalette({
  styleId,
  dims,
  pathId,
}: {
  styleId: string;
  dims: { length: number | null; width: number | null; height: number | null };
  pathId: string;
}) {
  const palette: StylePalette = paletteForStyle(styleId);
  const walls = wallCostFor(styleId, dims.length ?? 0, dims.width ?? 0, dims.height ?? 0);
  const rec = walls.recommended;
  const recCost = rec === "wallpaper" ? walls.wallpaper : walls.paint;

  return (
    <div className="relative mx-auto mt-10 w-full max-w-3xl">
      <div
        className="relative rounded-sm bg-[var(--paper)] px-6 py-7 sm:px-8"
        style={{ transform: "rotate(-0.6deg)" }}
      >
        <WashiTape className="left-10 -top-3 w-16 rotate-[-5deg]" color="sage" />
        <h3 className="font-display text-xl font-bold">
          the colour story — {palette.paletteName}
        </h3>
        <p className="font-handwriting text-base text-muted-foreground">
          five chips, one room. tape them up in this order ↓
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          {palette.swatches.map((s, i) => (
            <div key={s.hex} className="flex w-32 flex-col sm:w-36">
              <div
                className="h-14 w-full rounded-sm paper-shadow-sm"
                style={{
                  backgroundColor: s.hex,
                  transform: `rotate(${[0.8, -1.1, 0.5, -0.6, 1][i]}deg)`,
                  boxShadow:
                    "0 2px 4px rgb(0 0 0 / 0.08), 0 6px 12px rgb(0 0 0 / 0.06)",
                  border: "1px solid rgb(0 0 0 / 0.06)",
                }}
              />
              <p className="mt-1.5 text-center font-handwriting text-[13px] leading-tight text-muted-foreground">
                {s.role}
              </p>
            </div>
          ))}
        </div>

        {pathId !== "home_decor" && (
          <div
            className="mt-7 border-t border-dashed border-border pt-5"
          >
            <p className="font-display text-sm font-bold tracking-wide text-muted-foreground">
              walls — what it costs to wear this palette
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="font-handwriting text-base text-muted-foreground">
                muse says <strong className="font-display text-foreground">{rec === "wallpaper" ? "wallpaper" : "paint"}</strong> — {walls.recommendationNote}
              </span>
                <span className="ml-auto font-display text-lg font-bold">
                {inr(recCost.total)}
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  {rec === "wallpaper"
                    ? `(${(recCost as { sqm: number }).sqm} sqm of walls + labour)`
                    : `(${(recCost as { litres: number }).litres} L + labour)`}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
