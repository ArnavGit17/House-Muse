/*
 * HOUSE MUSE — trained design styles
 *
 * Each entry maps the BACKEND's trained LoRA key (`styleId`) to the
 * FRIENDLIER display label (`name`) shown on the card. The `styleId` is
 * the only string the backend's prompt-builder and LoRA loader recognize —
 * every analysis/generation API call MUST send `styleId`, never `name`.
 *
 * Mapping rules:
 *  - exact dataset matches keep the same word for id and label
 *    (vintage_indian, contemporary_indian, coastal, industrial)
 *  - close analogues keep a friendlier display name while training under
 *    a different real style underneath (scandinavian → Japandi,
 *    eclectic → Bohemian, shabby_chic_style → Cottagecore)
 *  - weak original matches show their TRUE trained name instead
 *    (mid_century_modern → Mid Century Modern, victorian → Victorian)
 */

export interface DesignStyle {
  styleId: string; // exact LoRA key — what the backend API calls expect
  id: string; // stable key for React lists (same as styleId here)
  name: string; // display label — what the user sees on the card
  note: string; // handwritten annotation
  swatch: string; // accent dot color for the card
  image: string; // on-theme preview image
}

export const DESIGN_STYLES: DesignStyle[] = [
  {
    styleId: "vintage_indian",
    id: "vintage_indian",
    name: "Vintage Indian",
    note: "brass, teak, jaali detail",
    swatch: "#8B5A2B",
    image: "/images/styles/vintage-indian.jpg",
  },
  {
    styleId: "contemporary_indian",
    id: "contemporary_indian",
    name: "Contemporary Indian",
    note: "clean lines, warm materials",
    swatch: "#B0825A",
    image: "/images/styles/contemporary-indian.jpg",
  },
  {
    styleId: "coastal",
    id: "coastal",
    name: "Coastal",
    note: "airy, sun-bleached, breezy",
    swatch: "#8FA8A0",
    image: "/images/styles/coastal.jpg",
  },
  {
    styleId: "industrial",
    id: "industrial",
    name: "Industrial",
    note: "raw materials, exposed edges",
    swatch: "#6E665E",
    image: "/images/styles/industrial.jpg",
  },
  {
    styleId: "scandinavian",
    id: "scandinavian",
    name: "Japandi",
    note: "quiet, grounded, light wood and calm",
    swatch: "#A98E6B",
    image: "/images/styles/japandi.jpg",
  },
  {
    styleId: "eclectic",
    id: "eclectic",
    name: "Bohemian",
    note: "warm, layered, a little wild",
    swatch: "#C06A45",
    image: "/images/styles/bohemian.jpg",
  },
  {
    styleId: "shabby_chic_style",
    id: "shabby_chic_style",
    name: "Cottagecore",
    note: "cozy, lived-in, floral",
    swatch: "#C78AA0",
    image: "/images/styles/cottagecore.jpg",
  },
  {
    styleId: "mid_century_modern",
    id: "mid_century_modern",
    name: "Mid Century Modern",
    note: "teak, brass, a little zing",
    swatch: "#9E6B3A",
    image: "/images/styles/mid-century-modern.jpg",
  },
  {
    styleId: "victorian",
    id: "victorian",
    name: "Victorian",
    note: "moody wood, ornate detail",
    swatch: "#5A5247",
    image: "/images/styles/victorian.jpg",
  },
];

/*
 * buildStylePayload — the shape sent on every analysis/generation API call.
 * It carries ONLY the trained style id. The display label is UI-only and
 * must never be sent, since the backend prompt-builder and LoRA loader
 * recognize only the id.
 */
export function buildStylePayload(style: DesignStyle) {
  return { styleId: style.styleId };
}
