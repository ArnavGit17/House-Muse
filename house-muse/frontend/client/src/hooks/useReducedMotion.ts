/*
 * HOUSE MUSE — prefers-reduced-motion hook
 * The collage aesthetic is calm, but motion should always respect
 * users who prefer reduced motion (parallax + tilt are decorative).
 */
import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
