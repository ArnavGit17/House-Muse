/*
 * HOUSE MUSE — Landing page ("the journal opener")
 * Style: "The Design Journal".
 *  - Hero = opening spread of a design journal: kraft underlay, torn edges,
 *    polaroid-framed hero photo pinned with washi tape, handwritten margin note
 *  - Asymmetric collage; items rotated and overlapping, never a perfect grid
 *  - Torn-paper dividers between sections; doodles tucked in corners
 *  - 3D polish: cursor-following tilt on polaroids, shadow tracks tilt
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import Polaroid, { PolaroidQuiet } from "@/components/aesthetic/Polaroid";
import {
  WashiTape,
  Pin,
  DoodleStar,
  DoodleHeart,
  TornDivider,
  CornerSprig,
} from "@/components/aesthetic/Craft";
import { IMG } from "@/lib/mockData";
import { DESIGN_STYLES } from "@/lib/styles";

const fadeUp = {
  hidden: { opacity: 0, y: 14, rotate: 0 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 140,
      damping: 20,
      delay: 0.06 * i,
    },
  }),
};

function Hero() {
  const prefersReduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden">
      {/* kraft underlay behind the hero spread */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--paper-kraft)" }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 top-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 75% 15%, oklch(0.93 0.03 80) 0%, transparent 70%)",
        }}
      />

      <div className="container relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        {/* Text column */}
        <div className="relative z-10">
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
          >
            Tape your room down.
            <br />
            Let us{" "}
            <span className="hand-underline">dream it up</span>.
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            House Muse is an AI interior-design companion. Pin a photo of your
            space, choose a mood, and watch it come back reimagined — with the
            actual furniture to make it real.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/studio"
              className="font-sans relative inline-flex items-center gap-2 rounded-sm bg-[var(--terracotta)] px-6 py-3 text-base font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ rotate: "-0.8deg", boxShadow: "3px 4px 0 var(--sienna)" }}
            >
              Pin a photo →
            </Link>
            <Link
              href="/board"
              className="font-sans underline decoration-[var(--terracotta)] decoration-2 underline-offset-4 text-sm font-semibold text-foreground/80 hover:text-foreground"
            >
              peek at a mood board
            </Link>
          </motion.div>

          <DoodleStar className="absolute -left-6 top-2 h-6 w-6 text-[var(--terracotta)] sm:-left-14" />
          <DoodleHeart className="absolute -bottom-4 left-2 h-5 w-5 text-[var(--sage)] sm:left-10" />
        </div>

        {/* Polaroid cluster */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.25 }}
          className="relative mx-auto w-full max-w-sm"
        >
          {/* cream sheet under the main polaroid */}
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-[2px] bg-[var(--paper-cream)]"
            style={{
              rotate: "1.5deg",
              boxShadow: "0 6px 24px rgba(45,30,15,0.12)",
            }}
          />
          <Polaroid
            src={IMG.heroRoom}
            alt="A warm, sunlit living room reimagined by House Muse"
            caption="the living room, golden hour"
            rotation={2.5}
            className="relative"
            tiltIntensity={0.8}
          >
            <WashiTape rotation={-14} width="4rem" height="1.1rem" className="-top-3 left-8" />
            <WashiTape
              color="var(--sage)"
              rotation={12}
              width="3.6rem"
              height="1rem"
              className="-top-2.5 right-10"
            />
          </Polaroid>

          {/* small overlapping polaroid */}
          <div className="absolute -bottom-10 -left-12 z-20 w-32 sm:-left-16 sm:w-36">
            <PolaroidQuiet
              src={IMG.vase}
              alt="Terracotta vase detail"
              rotation={-6}
              tiltIntensity={0.6}
              className="px-1.5 pb-3 pt-1.5 sm:px-2 sm:pb-4 sm:pt-2"
              imgClassName="aspect-square"
              caption="tiny things matter"
            />
          </div>

          <Pin className="left-24 top-0" />
        </motion.div>
      </div>

      <TornDivider paper="var(--paper)" className="relative z-10" />
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "1 · pin a photo",
      body: "Snap your room as it is — honest light, clutter included. We're not judging.",
      image: IMG.roomBefore,
      rotation: -2.5,
      tapeColor: "var(--terracotta)",
    },
    {
      title: "2 · choose a mood",
      body: "Vintage Indian, Japandi, Victorian… pick the feeling, not just the furniture.",
      image: IMG.chair,
      rotation: 1.8,
      tapeColor: "var(--sage)",
    },
    {
      title: "3 · keep the good ones",
      body: "Every piece we suggest is real, priced, and chosen to fit the room you actually have.",
      image: IMG.lamp,
      rotation: -1.4,
      tapeColor: "var(--clay)",
    },
  ];
  return (
    <section className="relative">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="relative mb-12">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">
            Three pages in the journal
          </h2>
          <p className="font-hand mt-2 text-xl text-[var(--terracotta)]">
            that's really all it takes ↓
          </p>
          <DoodleStar className="absolute -right-2 top-0 h-6 w-6 text-[var(--sage)] sm:right-10" />
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={i}
              className="relative mx-auto w-full max-w-xs"
              style={{ rotate: `${s.rotation}deg` }}
            >
              <div
                aria-hidden
                className="absolute -inset-3 -z-10 rounded-[2px]"
                style={{
                  background: i % 2 === 0 ? "var(--paper-cream)" : "var(--paper-kraft)",
                  boxShadow: "0 4px 16px rgba(45,30,15,0.10)",
                }}
              />
              <PolaroidQuiet
                src={s.image}
                alt={s.title}
                caption={s.title}
                rotation={-s.rotation * 0.6}
                tiltIntensity={0.5}
                className="mb-3"
                imgClassName="aspect-[4/5]"
              >
                <WashiTape
                  color={s.tapeColor}
                  rotation={-10}
                  width="3.5rem"
                  height="1rem"
                  className="-top-2.5 left-6"
                />
              </PolaroidQuiet>
              <p className="mx-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      <TornDivider paper="var(--paper-kraft)" flip className="rotate-180" />
    </section>
  );
}

function StylesTeaser() {
  return (
    <section className="relative" style={{ background: "var(--paper-kraft)" }}>
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-5xl">
              Moods we keep returning to
            </h2>
            <p className="font-hand mt-2 text-xl text-[var(--terracotta)]">
              every one of these is a whole world ↓
            </p>
          </div>
          <Link
            href="/studio"
            className="font-sans rounded-sm border border-[var(--terracotta)] px-4 py-2 text-sm font-bold text-[var(--terracotta)] transition-colors hover:bg-[var(--terracotta)] hover:text-primary-foreground"
            style={{ rotate: "1deg" }}
          >
            try the Studio →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {DESIGN_STYLES.map((style, i) => (
            <motion.div
              key={style.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              custom={i % 3}
              className={`relative mx-auto w-full max-w-[240px] ${i % 3 === 1 ? "md:mt-8" : ""}`}
            >
              <PolaroidQuiet
                src={style.image}
                alt={style.name}
                caption={style.name}
                rotation={(i % 2 === 0 ? 1.5 : -1.8) + (i % 3 - 1) * 0.4}
                tiltIntensity={0.5}
                imgClassName="aspect-square"
              >
                <WashiTape
                  color={style.swatch}
                  rotation={i % 2 === 0 ? -11 : 13}
                  width="3.2rem"
                  height="0.95rem"
                  className="-top-2 left-6"
                />
                <span className="font-hand absolute bottom-0 right-3 text-base text-[var(--sienna)]">
                  “{style.note}”
                </span>
              </PolaroidQuiet>
            </motion.div>
          ))}
        </div>
      </div>
      <TornDivider paper="var(--paper)" flip />
    </section>
  );
}

function ClosingSpread() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 90% at 30% 20%, oklch(0.94 0.02 80) 0%, var(--paper) 70%)",
        }}
      />
      <div className="container relative mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <CornerSprig className="absolute left-6 top-8 h-20 w-12 -scale-x-100 opacity-80" />
        <CornerSprig className="absolute right-6 bottom-10 h-20 w-12 opacity-80" />

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="font-display mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-5xl"
        >
          Your rooms deserve to be
          <span className="hand-underline"> daydreamed about</span>.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
          className="mx-auto mt-5 max-w-md text-muted-foreground"
        >
          Start with one photo. We'll bring back a vision — and the shopping
          list to match.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={2}
          className="mt-8"
        >
          <Link
            href="/studio"
            className="font-sans relative inline-flex items-center rounded-sm bg-[var(--terracotta)] px-8 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ rotate: "0.6deg", boxShadow: "3px 4px 0 var(--sienna)" }}
          >
            Open the Studio →
          </Link>
        </motion.div>
        <DoodleHeart className="mx-auto mt-10 h-6 w-6 text-[var(--terracotta)]" />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <StylesTeaser />
      <ClosingSpread />
    </div>
  );
}
