/*
 * HOUSE MUSE — mock product data
 * "The Design Journal": warm, hand-placed collage content.
 * All copy follows the handwritten-margin-notes brand voice.
 */

export const IMG = {
  logo: "/images/brand/logo.png",
  vision: "/images/brand/vision-ideal-room.png", // TODO: file not found on disk — save this image or repoint it
  heroRoom: "/images/brand/hero-room.jpg",
  roomBefore: "/images/brand/room-before.jpg",
  roomAfter: "/images/brand/room-after.jpg",
  moodDecor: "/images/brand/moodboard-decor.jpg",
  chair: "/images/brand/chair.jpg",
  lamp: "/images/brand/lamp.jpg",
  vase: "/images/brand/vase.jpg",
  rug: "/images/brand/rug.jpg",
  mirror: "/images/brand/mirror.jpg",
};

/* The futuristic vision image — "how the room is meant to look" */
export const VISION_IMG = IMG.vision;

/* DesignStyle lives in lib/styles.ts alongside the trained style registry.
 * It is re-exported here for convenience of existing imports.
 */
import { DESIGN_STYLES } from "./styles";
import type { DesignStyle } from "./styles";
export type { DesignStyle } from "./styles";

export interface FurniturePick {
  id: string;
  name: string;
  maker: string;
  price: number;
  note: string; // handwritten reason tag
  image: string;
  aiConfidence: number; // 0–100
  rotation: number; // degrees for collage placement
}

export const FURNITURE_PICKS: FurniturePick[] = [
  {
    id: "f1",
    name: "Woven Rattan Lounge Chair",
    maker: "Atelier Norte",
    price: 18500,
    note: "this one changed the whole corner",
    image: IMG.chair,
    aiConfidence: 94,
    rotation: -1.5,
  },
  {
    id: "f2",
    name: "Ceramic Glow Lamp",
    maker: "Fired Clay Co.",
    price: 5400,
    note: "the warm hum you were missing",
    image: IMG.lamp,
    aiConfidence: 88,
    rotation: 1.8,
  },
  {
    id: "f3",
    name: "Terracotta Bud Vase",
    maker: "Mud & Bloom",
    price: 1400,
    note: "dried grasses live here now",
    image: IMG.vase,
    aiConfidence: 81,
    rotation: -2.2,
  },
  {
    id: "f4",
    name: "Jute & Wool Weave Rug",
    maker: "Loom House",
    price: 12200,
    note: "soft underfoot, honest fibers",
    image: IMG.rug,
    aiConfidence: 90,
    rotation: 1.2,
  },
  {
    id: "f5",
    name: "Rattan Round Mirror",
    maker: "Wicker & Oak",
    price: 6700,
    note: "bounces the 4pm light around",
    image: IMG.mirror,
    aiConfidence: 76,
    rotation: -1,
  },
];

export interface MoodBoardItem {
  id: string;
  type: "photo" | "note" | "swatch" | "doodle";
  title?: string;
  body?: string;
  image?: string;
  color?: string;
  label?: string;
  rotation: number;
  x: number; // percent, for collage
  y: number; // percent, for collage
  z: number; // 0 = back, 1 = mid, 2 = front (parallax depth)
  caption?: string;
}

export const MOOD_BOARD_ITEMS: MoodBoardItem[] = [
  {
    id: "m1",
    type: "photo",
    title: "the room, as imagined",
    image: IMG.roomAfter,
    rotation: -2.5,
    x: 34,
    y: 8,
    z: 2,
    caption: "the dream version",
  },
  {
    id: "m2",
    type: "note",
    title: "keep the olive tree",
    body: "it likes that corner. don't move it. it's been through enough.",
    rotation: 3,
    x: 10,
    y: 30,
    z: 1,
  },
  {
    id: "m3",
    type: "photo",
    title: "rattan chair moment",
    image: IMG.chair,
    rotation: 2,
    x: 66,
    y: 40,
    z: 2,
    caption: "yes, this one",
  },
  {
    id: "m4",
    type: "swatch",
    label: "terracotta",
    color: "#C06A45",
    rotation: -3,
    x: 74,
    y: 12,
    z: 1,
  },
  {
    id: "m5",
    type: "swatch",
    label: "sage",
    color: "#8FA8A0",
    rotation: 2,
    x: 82,
    y: 22,
    z: 1,
  },
  {
    id: "m6",
    type: "swatch",
    label: "cream",
    color: "#F2E9DA",
    rotation: -1.5,
    x: 80,
    y: 33,
    z: 1,
  },
  {
    id: "m7",
    type: "note",
    title: "lighting notes",
    body: "swap the cool bulb. warm white (2700K). lamps over overheads, always.",
    rotation: -2,
    x: 8,
    y: 60,
    z: 2,
  },
  {
    id: "m8",
    type: "photo",
    title: "the lamp",
    image: IMG.lamp,
    rotation: -1.8,
    x: 30,
    y: 62,
    z: 2,
    caption: "2700K, promised",
  },
  {
    id: "m9",
    type: "photo",
    title: "rug, texture check",
    image: IMG.rug,
    rotation: 2.5,
    x: 56,
    y: 74,
    z: 1,
    caption: "bare feet approved",
  },
  {
    id: "m10",
    type: "doodle",
    rotation: 0,
    x: 46,
    y: 24,
    z: 2,
  },
  {
    id: "m11",
    type: "note",
    title: "budget corner",
    body: "vase + dried grasses: under $40. the most expensive thing here is the chair and it's worth it.",
    rotation: 1.5,
    x: 58,
    y: 4,
    z: 1,
  },
  {
    id: "m12",
    type: "photo",
    title: "pressed things",
    image: IMG.moodDecor,
    rotation: 1.2,
    x: 6,
    y: 84,
    z: 2,
    caption: "tucked from the board",
  },
];

export interface StudioSession {
  uploadedPhoto: string;
  roomName: string;
  style: DesignStyle; // trained style entry from lib/styles
  aiConfidence: number; // 0–100
  confidenceNote: string;
  before: string;
  after: string;
  summary: string[];
  picks: FurniturePick[];
}

/* ---------- Budget (₹) — driven by the user's budget scale ---------- */
export interface BudgetCategory {
  label: string;
  amount: number; // INR
  color: string; // donut segment color
}

export interface BudgetBreakdown {
  categories: BudgetCategory[];
  total: number; // estimated total (INR)
  savedFrom: number; // “you save ₹X from your total budget”
}

/* Each trained style carries its own cost profile so the breakdown
 * always matches the chosen mood. Amounts are realistic INR figures. */
export const STYLE_BUDGETS: Record<string, BudgetBreakdown> = {
  vintage_indian: {
    categories: [
      { label: "Furniture", amount: 98000, color: "#5E7C62" },
      { label: "Curtains", amount: 24500, color: "#C9A227" },
      { label: "Wall Art", amount: 18600, color: "#8B5A2B" },
      { label: "Lamps", amount: 22400, color: "#B05A3C" },
      { label: "Rugs", amount: 31000, color: "#A98E6B" },
      { label: "Accent", amount: 12800, color: "#C78AA0" },
    ],
    total: 207300,
    savedFrom: 240000,
  },
  contemporary_indian: {
    categories: [
      { label: "Furniture", amount: 86000, color: "#5E7C62" },
      { label: "Curtains", amount: 19800, color: "#C9A227" },
      { label: "Wall Art", amount: 14200, color: "#8B5A2B" },
      { label: "Lamps", amount: 26000, color: "#B05A3C" },
      { label: "Rugs", amount: 22500, color: "#A98E6B" },
      { label: "Accent", amount: 11500, color: "#C78AA0" },
    ],
    total: 180000,
    savedFrom: 210000,
  },
  coastal: {
    categories: [
      { label: "Furniture", amount: 72000, color: "#5E7C62" },
      { label: "Curtains", amount: 16500, color: "#C9A227" },
      { label: "Wall Art", amount: 9800, color: "#8B5A2B" },
      { label: "Lamps", amount: 18200, color: "#B05A3C" },
      { label: "Rugs", amount: 24000, color: "#A98E6B" },
      { label: "Accent", amount: 13400, color: "#C78AA0" },
    ],
    total: 153900,
    savedFrom: 180000,
  },
  industrial: {
    categories: [
      { label: "Furniture", amount: 94000, color: "#5E7C62" },
      { label: "Curtains", amount: 12400, color: "#C9A227" },
      { label: "Wall Art", amount: 21000, color: "#8B5A2B" },
      { label: "Lamps", amount: 34000, color: "#B05A3C" },
      { label: "Rugs", amount: 19800, color: "#A98E6B" },
      { label: "Accent", amount: 14200, color: "#C78AA0" },
    ],
    total: 195400,
    savedFrom: 230000,
  },
  scandinavian: {
    categories: [
      { label: "Furniture", amount: 68000, color: "#5E7C62" },
      { label: "Curtains", amount: 14200, color: "#C9A227" },
      { label: "Wall Art", amount: 10500, color: "#8B5A2B" },
      { label: "Lamps", amount: 16800, color: "#B05A3C" },
      { label: "Rugs", amount: 27600, color: "#A98E6B" },
      { label: "Accent", amount: 9400, color: "#C78AA0" },
    ],
    total: 146500,
    savedFrom: 170000,
  },
  eclectic: {
    categories: [
      { label: "Furniture", amount: 61000, color: "#5E7C62" },
      { label: "Curtains", amount: 15800, color: "#C9A227" },
      { label: "Wall Art", amount: 16400, color: "#8B5A2B" },
      { label: "Lamps", amount: 19500, color: "#B05A3C" },
      { label: "Rugs", amount: 33200, color: "#A98E6B" },
      { label: "Accent", amount: 15600, color: "#C78AA0" },
    ],
    total: 161500,
    savedFrom: 190000,
  },
  shabby_chic_style: {
    categories: [
      { label: "Furniture", amount: 54000, color: "#5E7C62" },
      { label: "Curtains", amount: 12800, color: "#C9A227" },
      { label: "Wall Art", amount: 11200, color: "#8B5A2B" },
      { label: "Lamps", amount: 14600, color: "#B05A3C" },
      { label: "Rugs", amount: 22800, color: "#A98E6B" },
      { label: "Accent", amount: 16900, color: "#C78AA0" },
    ],
    total: 132300,
    savedFrom: 155000,
  },
  mid_century_modern: {
    categories: [
      { label: "Furniture", amount: 102000, color: "#5E7C62" },
      { label: "Curtains", amount: 14000, color: "#C9A227" },
      { label: "Wall Art", amount: 19800, color: "#8B5A2B" },
      { label: "Lamps", amount: 23400, color: "#B05A3C" },
      { label: "Rugs", amount: 26500, color: "#A98E6B" },
      { label: "Accent", amount: 13800, color: "#C78AA0" },
    ],
    total: 199500,
    savedFrom: 235000,
  },
  victorian: {
    categories: [
      { label: "Furniture", amount: 130200, color: "#5E7C62" },
      { label: "Curtains", amount: 21700, color: "#C9A227" },
      { label: "Wall Art", amount: 24800, color: "#8B5A2B" },
      { label: "Lamps", amount: 31000, color: "#B05A3C" },
      { label: "Rugs", amount: 37200, color: "#A98E6B" },
      { label: "Accent", amount: 18600, color: "#C78AA0" },
    ],
    total: 212080,
    savedFrom: 90000,
  },
};

/* Budget scale tiers the user picks from (INR) */
export const BUDGET_TIERS = [
  { value: 100000, label: "under 1 lakh" },
  { value: 200000, label: "up to 2 lakh" },
  { value: 350000, label: "up to 3.5 lakh" },
  { value: 500000, label: "up to 5 lakh" },
  { value: 800000, label: "more, darling" },
];

import { wallCostFor } from "./designData";
import type { RoomDetails } from "@/components/studio/RoomDetails";

export type DesignPathId = "home_decor" | "interior_design" | "full_makeover";

export type RoomTypeId = "bedroom" | "living_room" | "dining_room" | "kitchen" | "bathroom";

export interface RoomTypeOption {
  id: RoomTypeId;
  label: string;
}

export const ROOM_TYPES: RoomTypeOption[] = [
  { id: "bedroom", label: "bedroom" },
  { id: "living_room", label: "living room" },
  { id: "dining_room", label: "dining room" },
  { id: "kitchen", label: "kitchen" },
  { id: "bathroom", label: "bathroom" },
];

export function scaleBudget(
  styleId: string,
  userBudget: number,
  pathId: DesignPathId = "home_decor",
  dims?: RoomDetails
): BudgetBreakdown {
  const base = STYLE_BUDGETS[styleId] ?? STYLE_BUDGETS["eclectic"];
  /* Interior design paths carry the room shell (walls), so décor spend is
   * scaled a touch lower — part of the budget moves into walls. */
  const decorShare = pathId === "home_decor" ? 1 : 0.78;
  const factor = Math.max(0.6, Math.min(3.2, userBudget / 200000));
  const round = (n: number) => Math.round(n / 100) * 100;
  const categories = base.categories.map((c) => ({
    ...c,
    amount: round(c.amount * factor * decorShare),
  }));

  /* Wallpaper/paint only enters the ledger when the path redesigns the
   * shell. The recommended option (paint vs paper) carries the real cost. */
  const wallCosts = dims
    ? wallCostFor(styleId, Number(dims.length) || 0, Number(dims.width) || 0, Number(dims.height) || 0)
    : null;
  if (wallCosts && pathId !== "home_decor") {
    const wallTotal = wallCosts.recommended === "wallpaper"
      ? wallCosts.wallpaper.total
      : wallCosts.paint.total;
    categories.push({
      label: wallCosts.recommended === "wallpaper" ? "Wallpaper" : "Paint",
      amount: round(wallTotal),
      color: "#8A7160",
    });
  }

  const total = categories.reduce((s, c) => s + c.amount, 0);
  return { categories, total, savedFrom: userBudget };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Maps the REAL backend response (result.recommendations from
 * /api/studio/analyse/) into the same BudgetBreakdown shape the UI already
 * renders. Prefer this over scaleBudget() whenever real API data is
 * available — scaleBudget() is a client-side estimate for the no-file demo
 * path only.
 * ───────────────────────────────────────────────────────────────────────── */
const BUDGET_CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  wallpaper: { label: "Wallpaper", color: "#6E665E" },
  furniture: { label: "Furniture", color: "#5E7C62" },
  curtains: { label: "Curtains", color: "#C9A227" },
  rugs: { label: "Rugs", color: "#A98E6B" },
  lamps: { label: "Lamps", color: "#B05A3C" },
  wall_art: { label: "Wall Art", color: "#8B5A2B" },
  accent: { label: "Accent", color: "#C78AA0" },
};

export interface BackendRecommendations {
  budget_breakdown: Record<string, number>;
  total_estimated: number;
  budget_remaining: number;
  decor_items?: unknown[];
  wallpapers?: unknown[];
  summary?: string;
}

export function mapBackendBudget(recommendations: BackendRecommendations): BudgetBreakdown {
  const categories = Object.entries(recommendations.budget_breakdown ?? {}).map(
    ([key, amount]) => {
      const style = BUDGET_CATEGORY_STYLE[key] ?? { label: key, color: "#8A7160" };
      return { label: style.label, amount, color: style.color };
    }
  );
  return {
    categories,
    total: recommendations.total_estimated ?? 0,
    savedFrom: recommendations.budget_remaining ?? 0,
  };
}

export const STUDIO_SESSION: StudioSession = {
  uploadedPhoto: IMG.roomBefore,
  roomName: "the bedroom (west corner)",
  style: DESIGN_STYLES[5], // eclectic (shown as "Bohemian")
  aiConfidence: 91,
  confidenceNote: "the light here is honest — I know this room well",
  before: IMG.roomBefore,
  after: IMG.roomAfter,
  summary: [
    "Softened the light: warm 2700K lamps instead of the cold overhead.",
    "Layered the bed with linen in terracotta + cream — texture does the talking.",
    "Wove in rattan at the headboard and a round mirror to move the afternoon light.",
    "Kept the olive tree exactly where it was. Some things are already perfect.",
  ],
  picks: FURNITURE_PICKS,
};
