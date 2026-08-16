/*
 * HOUSE MUSE — footer
 * Style: "The Design Journal". A closing journal note: handwritten sign-off,
 * pressed sprig doodle, taped edge.
 */
import { Link } from "wouter";
import { IMG } from "@/lib/mockData";
import { DoodleSprig, WashiTape } from "@/components/aesthetic/Craft";

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden" style={{ background: "var(--paper-kraft)" }}>
      <div className="container mx-auto max-w-6xl px-4 py-12 text-center">
        <DoodleSprig className="mx-auto mb-4 h-14 w-9 text-[var(--sage)]" />
        <div className="relative mx-auto inline-block">
          <img src={IMG.logo} alt="" className="mx-auto mb-3 h-10 w-10" style={{ rotate: "-3deg" }} />
          <span className="font-display text-lg font-bold">
            House<span className="text-[var(--terracotta)]"> Muse</span>
          </span>
        </div>
        <p className="font-hand mt-3 text-2xl text-[var(--sienna)]">
          signed, your design muse ✦
        </p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <Link href="/" className="font-semibold text-foreground/70 hover:text-foreground">
            Home
          </Link>
          <Link href="/studio" className="font-semibold text-foreground/70 hover:text-foreground">
            Studio
          </Link>
          <Link href="/board" className="font-semibold text-foreground/70 hover:text-foreground">
            Mood Board
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          A design-journal concept — every room photo and product here is a
          styled demo.
        </p>
      </div>
      <WashiTape rotation={4} width="4rem" height="1rem" className="bottom-0 left-1/4" />
      <WashiTape
        color="var(--sage)"
        rotation={-6}
        width="4rem"
        height="1rem"
        className="bottom-0 right-1/4"
      />
    </footer>
  );
}
