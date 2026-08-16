/*
 * HOUSE MUSE — interior-design system data
 *
 * This is an INTERIOR DESIGN recommendation system, not a home-decor
 * picker. Every session begins by choosing a path:
 *
 *   home_decor      — styling only: soft goods, lamps, art, accents
 *   interior_design — the shell too: paint / wallpaper + layout + decor
 *   full_makeover   — both combined, top to bottom
 *
 * Paths are sent to the backend as `pathId` (never the display label)
 * alongside `styleId` on every analysis/generation API call.
 */

import { DESIGN_STYLES } from "./styles";

/* ---------- Paths ---------- */
export interface DesignPath {
  pathId: string;
  name: string;
  blurb: string;
  includes: string[];
  image: string;
}

export const DESIGN_PATHS: DesignPath[] = [
  {
    pathId: "home_decor",
    name: "Home Decor",
    blurb: "style the room you already have — layers, light, and little things",
    includes: ["furniture & accents", "curtains & rugs", "lamps & wall art"],
    image: "/images/paths/home-decor.png",
  },
  {
    pathId: "interior_design",
    name: "Interior Design",
    blurb: "redesign the space — walls, surfaces, and how it's arranged",
    includes: ["paint or wallpaper", "layout & colour plan", "furniture & styling"],
    image: "/images/paths/interior-design.jpg",
  },
  {
    pathId: "full_makeover",
    name: "Full Makeover",
    blurb: "both — the whole room, top to bottom, nothing held back",
    includes: ["paint + wallpaper", "furniture + layout", "full styling pass"],
    image: "/images/paths/full-makeover.jpg",
  },
];

/* ---------- Recommended colour palettes ----------
 * Five swatches per trained style, each with a wall/surface role.
 * Chosen so the palette reflects the style's true visual character and
 * gives the user paint + wallpaper direction, not just vibes. */
export interface PaletteSwatch {
  hex: string;
  role: string; // wall, secondary wall, trim, accent, textiles
}

export interface StylePalette {
  styleId: string;
  paletteName: string; // short handwritten name
  swatches: PaletteSwatch[];
}

export const STYLE_PALETTES: StylePalette[] = [
  {
    styleId: "vintage_indian",
    paletteName: "jaali shadows",
    swatches: [
      { hex: "#7A5C33", role: "feature wall — deep teak" },
      { hex: "#F1E3C8", role: "walls — lime plaster cream" },
      { hex: "#C9A227", role: "trim — aged brass" },
      { hex: "#8B2F2F", role: "accent — ranipuri red" },
      { hex: "#5E7C62", role: "textiles — bottle green" },
    ],
  },
  {
    styleId: "contemporary_indian",
    paletteName: "warm modern",
    swatches: [
      { hex: "#E8DECC", role: "walls — warm ivory" },
      { hex: "#B0825A", role: "feature wall — caramel" },
      { hex: "#F5F1E7", role: "trim — soft white" },
      { hex: "#3E5C52", role: "accent — deep teal" },
      { hex: "#D9C3A2", role: "textiles — natural linen" },
    ],
  },
  {
    styleId: "coastal",
    paletteName: "sun-washed",
    swatches: [
      { hex: "#F4F0E4", role: "walls — bleached sand" },
      { hex: "#A8C3CC", role: "feature wall — sea haze" },
      { hex: "#FFFFFF", role: "trim — crisp white" },
      { hex: "#6E8C9B", role: "accent — weathered blue" },
      { hex: "#D8C9A3", role: "textiles — driftwood beige" },
    ],
  },
  {
    styleId: "industrial",
    paletteName: "raw steel",
    swatches: [
      { hex: "#4A453F", role: "feature wall — charcoal concrete" },
      { hex: "#D8D2C6", role: "walls — cool putty" },
      { hex: "#8C867C", role: "trim — oxidized steel" },
      { hex: "#A94E2E", role: "accent — rust" },
      { hex: "#3A3A3A", role: "textiles — matte black" },
    ],
  },
  {
    styleId: "scandinavian",
    paletteName: "quiet wood",
    swatches: [
      { hex: "#F7F3EA", role: "walls — oat white" },
      { hex: "#D3C3A3", role: "feature wall — light birch" },
      { hex: "#FFFFFF", role: "trim — pure white" },
      { hex: "#8FA8A0", role: "accent — muted sage" },
      { hex: "#BFAFA0", role: "textiles — warm grey" },
    ],
  },
  {
    styleId: "eclectic",
    paletteName: "warm wild",
    swatches: [
      { hex: "#EFE3D0", role: "walls — warm cream" },
      { hex: "#C06A45", role: "feature wall — terracotta" },
      { hex: "#EAD9B8", role: "trim — butter" },
      { hex: "#5E4B8F", role: "accent — deep aubergine" },
      { hex: "#8A6B3F", role: "textiles — mustard" },
    ],
  },
  {
    styleId: "shabby_chic_style",
    paletteName: "garden soft",
    swatches: [
      { hex: "#F6EFDE", role: "walls — old lace" },
      { hex: "#C78AA0", role: "feature wall — rose blush" },
      { hex: "#FBF7EE", role: "trim — cream" },
      { hex: "#9BB08E", role: "accent — moss" },
      { hex: "#D9BFD6", role: "textiles — lilac haze" },
    ],
  },
  {
    styleId: "mid_century_modern",
    paletteName: "teak & zing",
    swatches: [
      { hex: "#E6DCC5", role: "walls — flax" },
      { hex: "#9E6B3A", role: "feature wall — teak amber" },
      { hex: "#F2EDE2", role: "trim — almond" },
      { hex: "#2E6E62", role: "accent — petrol" },
      { hex: "#E8A33D", role: "textiles — marigold" },
    ],
  },
  {
    styleId: "victorian",
    paletteName: "candlelit",
    swatches: [
      { hex: "#3E342A", role: "feature wall — espresso wood" },
      { hex: "#E2D6BE", role: "walls — parchment" },
      { hex: "#9E8A6A", role: "trim — gilded beige" },
      { hex: "#6E2E33", role: "accent — oxblood" },
      { hex: "#4A5D4B", role: "textiles — hunter green" },
    ],
  },
];

export function paletteForStyle(styleId: string): StylePalette {
  return (
    STYLE_PALETTES.find((p) => p.styleId === styleId) ??
    STYLE_PALETTES[5] /* eclectic */
  );
}

/* ---------- Paint & wallpaper cost recommendations ----------
 * Realistic INR rates (2026 Indian market):
 *   premium emulsion paint   ≈ ₹35/L (≈ ₹25–45/L band)
 *   paintable wallpaper      ≈ ₹1,200/roll (53cm × 10m ≈ 5.3 sqm) → ₹226/sqm
 *   premium designer paper   ≈ ₹3,500/roll → ₹660/sqm
 * Labour (paint) ≈ ₹18/sqm; (wallpaper) ≈ ₹25/sqm.
 * Wall area: floor perimeter × height. Ceiling excluded. */
export interface WallCost {
  paint: { litres: number; paintCost: number; labour: number; total: number };
  wallpaper: {
    sqm: number;
    materialCost: number; // mid-tier paper @ ₹226/sqm
    labour: number;
    total: number;
  };
  recommended: "paint" | "wallpaper"; // per-style recommendation
  recommendationNote: string; // handwritten note for the card
}

function wallArea(lengthM: number, widthM: number, heightM: number) {
  const perimeter = 2 * (lengthM + widthM);
  return perimeter * heightM;
}

const STYLE_WALL_RECOMMENDATIONS: Record<string, { rec: "paint" | "wallpaper"; note: string }> = {
  vintage_indian: { rec: "paint", note: "matte plaster finish takes jaali light best" },
  contemporary_indian: { rec: "paint", note: "flat warm ivory — let the wood do the work" },
  coastal: { rec: "paint", note: "washable low-sheen — salt air forgiveable" },
  industrial: { rec: "wallpaper", note: "concrete-look paper gives the raw shell fast" },
  scandinavian: { rec: "paint", note: "lime-matte white, one warm layer" },
  eclectic: { rec: "wallpaper", note: "a mural wall behind the bed — worth it" },
  shabby_chic_style: { rec: "wallpaper", note: "soft floral paper, no more than two walls" },
  mid_century_modern: { rec: "paint", note: "flax base, teak feature wall in paint" },
  victorian: { rec: "wallpaper", note: "damask over the feature wall — this is the style's heart" },
};

export function wallCostFor(
  styleId: string,
  lengthM: number,
  widthM: number,
  heightM: number
): WallCost {
  const L = Math.max(1, Number(lengthM) || 4);
  const W = Math.max(1, Number(widthM) || 3.5);
  const H = Math.max(1.8, Number(heightM) || 2.7);
  const area = wallArea(L, W, H);

  const paintRate = 35; // ₹/L, coverage ~10 sqm/L per coat, 2 coats
  const litres = Math.ceil((area * 2) / 10);
  const paintLabourRate = 18;

  const paperRate = 226; // ₹/sqm mid-tier
  const paperLabourRate = 25;

  const recData = STYLE_WALL_RECOMMENDATIONS[styleId] ?? {
    rec: "paint",
    note: "paint is the safer first layer",
  };

  return {
    paint: {
      litres,
      paintCost: litres * paintRate,
      labour: Math.round(area * paintLabourRate),
      total: litres * paintRate + Math.round(area * paintLabourRate),
    },
    wallpaper: {
      sqm: Math.round(area),
      materialCost: Math.round(area * paperRate),
      labour: Math.round(area * paperLabourRate),
      total: Math.round(area * paperRate) + Math.round(area * paperLabourRate),
    },
    recommended: recData.rec,
    recommendationNote: recData.note,
  };
}

/* All style ids, for grids/legends that must loop over exactly the trained nine */
export const STYLE_IDS = DESIGN_STYLES.map((s) => s.styleId);

/* Room dimensions as numbers (metres). The Studio form keeps strings
 * (see components/studio/RoomDetails.tsx) — call sites convert. */
export interface RoomDims {
  length: number;
  width: number;
  height: number;
}
