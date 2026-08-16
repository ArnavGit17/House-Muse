/*
 * HOUSE MUSE — Mood Board page
 * Style: "The Design Journal".
 *  The board is an actual scattered corkboard (kraft texture) — items placed
 *  by hand at % coordinates, each declared at a depth layer:
 *    z=0 back / z=1 mid / z=2 front
 *  Scroll parallax (useScrollParallax): front items drift slightly FASTER
 *  than back ones, so depth reads on scroll.
 *  Furniture recommendations = taped-in polaroids with handwritten price
 *  tags; AI confidence = hand-drawn badge.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import Polaroid from "@/components/aesthetic/Polaroid";
import {
  WashiTape,
  Pin,
  DoodleStar,
  DoodleHeart,
  TornDivider,
  ConfidenceBadge,
  PriceTag,
} from "@/components/aesthetic/Craft";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { IMG, MOOD_BOARD_ITEMS, FURNITURE_PICKS, type MoodBoardItem } from "@/lib/mockData";

const TAPE_COLORS = ["var(--terracotta)", "var(--sage)", "var(--clay)", "var(--sienna)"];

/* ---------- Individual board item ---------- */
function BoardItem({ item }: { item: MoodBoardItem }) {
  const { ref, style } = useScrollParallax(item.z);
  const tape = TAPE_COLORS[item.id.charCodeAt(1) % TAPE_COLORS.length];

  if (item.type === "doodle") {
    return (
      <motion.div
        ref={ref}
        style={style}
        className="absolute"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <DoodleStar
          className="h-8 w-8 text-[var(--terracotta)]"
        />
      </motion.div>
    );
  }

  if (item.type === "note") {
    return (
      <motion.div
        ref={ref}
        style={style}
        className="absolute w-48 sm:w-56"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
      >
        <div
          className="relative bg-[var(--paper-cream)] p-4 paper-shadow"
          style={{ rotate: `${item.rotation}deg` }}
        >
          <WashiTape color={tape} rotation={-8} width="3rem" height="0.9rem" className="-top-2 left-6" />
          <h3 className="font-hand text-2xl text-[var(--sienna)]">{item.title}</h3>
          <p className="font-hand mt-1 text-lg leading-snug text-muted-foreground">
            {item.body}
          </p>
        </div>
      </motion.div>
    );
  }

  if (item.type === "swatch") {
    return (
      <motion.div
        ref={ref}
        style={style}
        className="absolute"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 150, damping: 18 }}
      >
        <div
          className="relative h-16 w-16 rounded-[2px] paper-shadow sm:h-20 sm:w-20"
          style={{
            rotate: `${item.rotation}deg`,
            background: item.color,
            boxShadow: "2px 3px 8px rgba(45,30,15,0.25)",
            border: "1px solid rgba(45,30,15,0.12)",
          }}
        >
          <WashiTape rotation={40} width="2.4rem" height="0.75rem" className="-right-1 -top-1.5" />
          <span className="font-hand absolute -bottom-5 left-1/2 w-max -translate-x-1/2 whitespace-nowrap text-base text-[var(--sienna)]">
            {item.label}
          </span>
        </div>
      </motion.div>
    );
  }

  /* photo */
  return (
    <motion.div
      ref={ref}
      style={style}
      className="absolute w-44 sm:w-56"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 130, damping: 18 }}
    >
      <Polaroid
        src={item.image!}
        alt={item.title ?? item.caption ?? ""}
        caption={item.caption}
        rotation={item.rotation}
        tiltIntensity={0.7}
        imgClassName="aspect-[4/5]"
      >
        <Pin />
        <WashiTape color={tape} rotation={-10} width="3.2rem" height="0.9rem" className="-top-2.5 right-6" />
      </Polaroid>
    </motion.div>
  );
}

/* ---------- The corkboard ---------- */
function Corkboard() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "var(--paper-kraft)",
          backgroundImage: `
            radial-gradient(oklch(0.35 0.03 50 / 0.16) 1px, transparent 1px),
            radial-gradient(oklch(0.35 0.03 50 / 0.10) 1px, transparent 1px)
          `,
          backgroundSize: "26px 26px, 13px 13px",
          backgroundPosition: "0 0, 7px 7px",
        }}
      />
      {/* vignette: desk-lamp feel */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 90% at 50% 15%, transparent 45%, oklch(0.12 0.02 50 / 0.32) 100%)",
        }}
      />

      <div className="container relative mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="relative mb-10 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">
            the board, pinned &amp; taped
          </h2>
          <p className="font-hand mt-2 text-xl text-[var(--terracotta)]">
            scroll slowly — the front things move a little faster ↓
          </p>
          <DoodleStar className="absolute right-6 top-0 h-6 w-6 text-[var(--sage)]" />
        </div>

        {/* collage canvas: relative container, items positioned by % */}
        <div className="relative mx-auto aspect-[4/3] w-full max-w-4xl md:aspect-[16/10]">
          {MOOD_BOARD_ITEMS.map((item) => (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                zIndex: 5 + item.z * 10,
              }}
            >
              <BoardItem item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Furniture recommendations ---------- */
function FurnitureWall() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="relative">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="relative mb-12">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">
            the shopping list, taped in
          </h2>
          <p className="font-hand mt-2 text-xl text-[var(--terracotta)]">
            every piece is real — prices are, too
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ConfidenceBadge
              value={92}
              note="how much these fit the room"
            />
            <p className="max-w-xs text-sm text-muted-foreground">
              Each pick scored against the reimagined room. Drag a card to
              shuffle the wall.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FURNITURE_PICKS.map((pick, i) => (
            <motion.div
              key={pick.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                type: "spring",
                stiffness: 130,
                damping: 18,
                delay: 0.05 * (i % 3),
              }}
              className="relative mx-auto w-full max-w-[300px]"
              onMouseEnter={() => setHoveredId(pick.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ rotate: `${pick.rotation}deg` }}
            >
              <div
                aria-hidden
                className="absolute -inset-2.5 -z-10 rounded-[2px] bg-[var(--paper-cream)]"
                style={{
                  rotate: `${-pick.rotation * 0.5}deg`,
                  boxShadow: "0 5px 18px rgba(45,30,15,0.12)",
                }}
              />
              <Polaroid
                src={pick.image}
                alt={pick.name}
                caption={pick.name}
                rotation={-pick.rotation * 0.4}
                className="paper-shadow-lg"
                imgClassName="aspect-square"
              >
                <Pin />
                <WashiTape
                  color={TAPE_COLORS[i % TAPE_COLORS.length]}
                  rotation={i % 2 === 0 ? -11 : 12}
                  width="3.4rem"
                  height="0.95rem"
                  className="-top-2.5 left-7"
                />
              </Polaroid>

              <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
                <PriceTag price={pick.price} rotation={2} />
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pick.maker}
                </span>
              </div>
              <p className="font-hand mt-2 px-1 text-lg text-[var(--sienna)]">
                “{pick.note}”
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative mx-auto mt-14 max-w-md">
          <div
            className="bg-card p-5 paper-shadow"
            style={{ rotate: "-1.2deg" }}
          >
            <WashiTape color="var(--terracotta)" rotation={-5} width="3rem" height="0.9rem" className="-top-2 right-8" />
            <p className="font-hand text-xl leading-snug text-[var(--sienna)]">
              total for the whole corner: ~₹44,200 — cheaper than repainting
              twice, warmer than both times.
            </p>
          </div>
          <DoodleHeart className="absolute -right-6 -bottom-4 h-6 w-6 text-[var(--terracotta)]" />
        </div>
      </div>
      <TornDivider paper="var(--paper)" flip />
    </section>
  );
}

/* ---------- MoodBoard page ---------- */
export default function MoodBoard() {
  return (
    <div className="min-h-screen">
      <Corkboard />
      <TornDivider paper="var(--paper)" />
      <FurnitureWall />
    </div>
  );
}
