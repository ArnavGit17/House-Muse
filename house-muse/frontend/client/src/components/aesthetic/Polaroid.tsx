/*
 * HOUSE MUSE — Polaroid
 * Style: "The Design Journal" — a photo on a cream frame, slightly rotated,
 * sitting on the page like it was placed by hand.
 *
 * 3D polish (brief 2): cursor-following tilt (≤5° on both axes) with a
 * matching directional shadow — the shadow tracks the tilt so the photo
 * reads as physically lifting toward the light. Springs back flat on leave.
 * GPU-only transforms; calm, editorial easing.
 */
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export interface PolaroidProps {
  src: string;
  alt?: string;
  caption?: string;
  rotation?: number; // static base rotation, degrees
  className?: string;
  /** whether hover tilt is enabled (default true for interactive surfaces) */
  interactive?: boolean;
  /** override for the tilt intensity */
  tiltIntensity?: number;
  style?: React.CSSProperties;
  imgClassName?: string;
  children?: React.ReactNode;
}

export default function Polaroid({
  src,
  alt = "",
  caption,
  rotation = 0,
  className,
  interactive = true,
  tiltIntensity = 1,
  style,
  imgClassName,
  children,
}: PolaroidProps) {
  const prefersReduced = useReducedMotion();
  const active = interactive && !prefersReduced;

  const rx = useMotionValue(0); // rotateX degrees
  const ry = useMotionValue(0); // rotateY degrees
  const sx = useSpring(ry, { stiffness: 220, damping: 22 });
  const sy = useSpring(rx, { stiffness: 220, damping: 22 });

  // Shadow tracks tilt: light assumed top-center (desk lamp above)
  const maxTilt = 5 * tiltIntensity;
  const shadowX = useTransform(ry, [-maxTilt, maxTilt], [8, -8]);
  const shadowY = useTransform(rx, [-maxTilt, maxTilt], [14, 6]);
  const blur = useTransform(rx, [-maxTilt, maxTilt], [18, 30]);
  const spread = useTransform(rx, [-maxTilt, maxTilt], [4, 16]);

  const tiltShadow = useTransform(
    [shadowX, shadowY, blur, spread] as MotionValue<number>[],
    ([x, y, b, s]: number[]) =>
      `${x}px ${y}px ${b}px -${s * 0.5}px rgba(45,30,15,0.18), ${s}px ${y + 12}px ${b + 14}px rgba(45,30,15,0.10)`
  );

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    // tilt toward cursor; ry rotates around Y from X offset, rx around X from Y offset
    rx.set((0.5 - py) * maxTilt);
    ry.set((px - 0.5) * maxTilt);
  };
  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      className={cn(
        "relative bg-card text-card-foreground polaroid-shadow",
        "px-2.5 pt-2.5 pb-4 sm:px-3.5 sm:pt-3.5 sm:pb-6",
        "will-change-transform",
        className
      )}
      style={{
        rotate: `${rotation}deg`,
        transformStyle: "preserve-3d",
        rotateX: active ? sy : 0,
        rotateY: active ? sx : 0,
        boxShadow: active ? tiltShadow : undefined,
        ...(style ?? {}),
      }}
      {...(active
        ? {
            onMouseMove: handleMove,
            onMouseLeave: handleLeave,
          }
        : {})}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <div className="overflow-hidden bg-[oklch(0.92_0.02_85)]">
        <img
          src={src}
          alt={alt}
          className={cn("w-full object-cover", imgClassName)}
          draggable={false}
          loading="lazy"
        />
      </div>
      {caption && (
        <p className="font-hand mt-2 text-center text-lg leading-none text-[var(--sienna)] sm:text-xl">
          {caption}
        </p>
      )}
      {children}
    </motion.div>
  );
}

/* A simpler framed-photo variant used on landing where tilt stays very subtle */
export function PolaroidQuiet(props: PolaroidProps) {
  return <Polaroid tiltIntensity={0.5} {...props} />;
}
