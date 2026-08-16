/*
 * HOUSE MUSE — useScrollParallax
 * Drives the mood-board parallax: items declared at different depths
 * (z = 0 back / 1 mid / 2 front) drift at different rates as the user
 * scrolls, so the collage reads like stacked paper with real depth.
 * Front items move slightly faster than back items.
 *
 * Implementation: uses framer-motion `useScroll` + `useTransform` on a
 * scoped container ref; rates are subtle (0 to ±0.15 of scroll) so the
 * effect stays editorial.
 */
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

export function useScrollParallax(depth: number) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // depth 2 (front) drifts fastest; depth 0 (back) barely moves
  const rate = (depth - 1) * 24; // px range, e.g. -24 / 0 / 24
  const y = useTransform(scrollYProgress, [0, 1], [rate, -rate]);

  return {
    ref,
    style: prefersReduced
      ? undefined
      : ({ y } as { y: MotionValue<number> }),
  };
}
