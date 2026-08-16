/*
 * HOUSE MUSE — Studio flow
 * Style: "The Design Journal".
 *  Step 1 · Pin a photo  — the uploaded photo lands as a polaroid being
 *            "pinned" (spring entrance + pin animation)
 *  Step 2 · Choose a mood — style swatches taped to a cream page
 *  Step 3 · The reveal    — two tilted polaroids (before / after) connected
 *            by washi tape; each is draggable with a lift shadow that keeps
 *            pace with drag scale, so picking one up reads as lifting it off
 *            the page
 *  The confidence readout is a hand-drawn badge, not a progress bar.
 */
import { useState } from "react";
import { motion, useAnimationControls, useMotionValue } from "framer-motion";
import { toast } from "sonner";
import { Wand2, Check } from "lucide-react";
import Polaroid from "@/components/aesthetic/Polaroid";
import {
  WashiTape,
  Pin,
  DoodleStar,
  TornDivider,
  ConfidenceBadge,
} from "@/components/aesthetic/Craft";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DESIGN_STYLES } from "@/lib/styles";
import type { DesignStyle } from "@/lib/styles";
import { IMG, scaleBudget, mapBackendBudget, type BudgetBreakdown as BudgetBreakdownData } from "@/lib/mockData";
import type { DesignPathId, RoomTypeId } from "@/lib/mockData";
import { ROOM_TYPES } from "@/lib/mockData";
import { RoomTypePicker, type RoomPhoto } from "@/components/studio/RoomTypePicker";
import { RoomDetailsStep, type RoomDetails } from "@/components/studio/RoomDetails";
import { BudgetBreakdown } from "@/components/studio/BudgetBreakdown";
import { VISION_IMG } from "@/lib/mockData";
import PathPicker from "@/components/studio/PathPicker";
import ColourPalette from "@/components/studio/ColourPalette";
import { useAuth } from "@/contexts/AuthContext";
import { analyseRoom, generateRoomImage } from "@/lib/api";
import { AuthModal } from "@/components/AuthModal";

const STEPS = [
  "pick the road",
  "pin your rooms",
  "choose a mood",
  "measure + budget",
  "see it reimagined",
] as const;

/* ---------------- Photo pinned preview ---------------- */
function PinnedPhoto({
  src,
  caption,
}: {
  src: string;
  caption: string;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[260px]"
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -24, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
    >
      <Polaroid src={src} alt={caption} caption={caption} rotation={-1.5}>
        <Pin />
        <WashiTape rotation={-10} width="3.4rem" height="0.95rem" className="-top-2.5 right-8" />
      </Polaroid>
      <p className="font-hand mt-3 text-center text-xl text-[var(--terracotta)]">
        pinned! nice room.
      </p>
    </motion.div>
  );
}

/* ---------------- Style picker ---------------- */
function StylePicker({
  selected,
  onSelect,
  uploaded,
}: {
  selected: DesignStyle;
  onSelect: (s: DesignStyle) => void;
  uploaded: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className="relative rounded-sm bg-[var(--paper-cream)] p-6 paper-shadow sm:p-10"
        style={{ rotate: "0.5deg" }}
      >
        <WashiTape rotation={8} width="3.6rem" height="1rem" className="-top-2.5 left-10" />
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          Which mood are we chasing?
        </h2>
        <p className="font-hand mt-1 text-xl text-[var(--terracotta)]">
          tap one — tape it down ↓
        </p>

        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
          {DESIGN_STYLES.map((style, i) => {
            const active = selected.id === style.id;
            return (
              <motion.button
                key={style.id}
                onClick={() => onSelect(style)}
                whileHover={uploaded ? { scale: 1.03, y: -3 } : undefined}
                whileTap={{ scale: 0.97 }}
                initial={
                  uploaded
                    ? { opacity: 0, y: 12 }
                    : { opacity: 0, y: 12, rotate: (i % 2 === 0 ? 1.5 : -1.5) }
                }
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 18,
                  delay: 0.06 * i,
                }}
                className="relative flex flex-col rounded-[2px] bg-card p-2 text-left paper-shadow transition-shadow hover:paper-shadow-lg"
                style={{ rotate: `${(i % 2 === 0 ? 1 : -1) * (0.8 + (i % 3) * 0.3)}deg` }}
                aria-pressed={active}
              >
                {active && (
                  <>
                    <WashiTape
                      color="var(--terracotta)"
                      rotation={-40}
                      width="3rem"
                      height="0.95rem"
                      className="-top-2 left-4 z-10"
                    />
                    <WashiTape
                      color="var(--terracotta)"
                      rotation={40}
                      width="3rem"
                      height="0.95rem"
                      className="-bottom-2 right-4 z-10"
                    />
                  </>
                )}
                <div className="overflow-hidden">
                  <img
                    src={style.image}
                    alt={style.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center gap-2 px-1.5 pb-1 pt-2">
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ background: style.swatch }}
                  />
                  <span className="font-sans text-sm font-bold">{style.name}</span>
                  {active && <Check size={15} className="ml-auto text-[var(--terracotta)]" />}
                </div>
                <p className="font-hand px-2 pb-1.5 text-base text-[var(--sienna)]">
                  “{style.note}”
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reveal step: draggable before/after polaroids ---------------- */
const DRAG_SHADOW_SCALE = {
  rest: "0 2px 4px rgba(45,30,15,0.12), 0 8px 24px rgba(45,30,15,0.18)",
  lifted:
    "0 6px 10px rgba(45,30,15,0.16), 0 20px 40px rgba(45,30,15,0.26), 0 40px 70px -8px rgba(45,30,15,0.24)",
};

function DraggablePolaroid({
  src,
  caption,
  rotation,
  dragLabel,
}: {
  src: string;
  caption: string;
  rotation: number;
  dragLabel: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimationControls();

  return (
    <motion.div
      className="relative w-full max-w-[280px] select-none"
      drag
      dragMomentum={false}
      dragElastic={0.15}
      animate={controls}
      whileDrag={{
        scale: 1.08,
        rotate: 0,
        zIndex: 50,
        boxShadow: DRAG_SHADOW_SCALE.lifted,
        cursor: "grabbing",
      }}
      onDragStart={() => controls.start({ zIndex: 50 })}
      onDragEnd={(_, info) => {
        const dist = Math.hypot(info.offset.x, info.offset.y);
        controls.start({ x: 0, y: 0, scale: 1, rotate: rotation, zIndex: 10 });
        if (dist > 120) {
          toast.success(`“${caption}” tucked into the mood board`);
        }
      }}
      style={{
        x,
        y,
        boxShadow: DRAG_SHADOW_SCALE.rest,
        touchAction: "none",
      }}
    >
      <Polaroid
        src={src}
        alt={caption}
        caption={caption}
        rotation={rotation}
        interactive={false}
        style={{ boxShadow: "inherit", cursor: "grab" }}
        className="paper-shadow-lg"
      >
        <span className="font-hand absolute -top-4 left-2 rounded-sm bg-[var(--terracotta)] px-2 py-0.5 text-sm text-primary-foreground">
          {dragLabel}
        </span>
      </Polaroid>
    </motion.div>
  );
}

/* ---------------- Future vision polaroid ----------------
 * The aspirational "how the room should look" — taped above the ledger. */
function VisionPolaroid({
  src,
  caption,
}: {
  src: string;
  caption: string;
}) {
  return (
    <div className="relative mx-auto mt-10 w-fit" style={{ rotate: "1.1deg" }}>
      <WashiTape rotation={-6} width="3.6rem" height="1rem" className="-top-2.5 left-1/2 -translate-x-1/2" />
      <Polaroid src={src} alt={caption} caption={caption} rotation={1.1} interactive={false}>
        <span className="font-hand absolute -top-4 right-2 rounded-sm bg-[var(--sage)] px-2 py-0.5 text-sm text-primary-foreground">
          the future
        </span>
      </Polaroid>
      <p className="font-hand mt-3 text-center text-lg text-[var(--terracotta)]">
        how it's meant to look ✦
      </p>
    </div>
  );
}

function RevealStep({
  onFinish,
  breakdown,
  dims,
  pathId,
  style,
  resultImage,
  confidence,
  processing,
  errorMsg,
  beforePhoto,
  roomLabel,
}: {
  onFinish: () => void;
  breakdown: ReturnType<typeof scaleBudget>;
  dims: { length: number; width: number; height: number };
  pathId: string;
  style: DesignStyle;
  resultImage: string | null;
  confidence: number;
  processing: boolean;
  errorMsg: string | null;
  beforePhoto: string;
  roomLabel: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-center gap-8">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold sm:text-4xl">
            {processing ? "developing the shot…" : "your room, reimagined"}
          </h2>
          <p className="font-hand mt-1 text-xl text-[var(--terracotta)]">
            {errorMsg ?? "drag them around — they're yours now"}
          </p>
        </div>
        {!processing && <ConfidenceBadge value={confidence} note="match to your chosen style" />}
      </div>

      <div
        className="relative rounded-sm bg-[var(--paper-cream)] p-8 paper-shadow sm:p-12"
        style={{ rotate: "-0.4deg" }}
      >
        <WashiTape rotation={-12} width="5rem" height="1.2rem" className="-top-3 left-1/2" />

        {/* connecting washi tape between the two polaroids */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 z-0 hidden h-1.5 w-24 -translate-x-1/2 sm:block washi-tape"
          style={{
            background: "var(--sage)",
            rotate: "-3deg",
            opacity: 0.6,
            boxShadow: "0 1px 3px rgba(45,30,15,0.15)",
          }}
        />
        <span
          aria-hidden
          className="font-hand absolute left-1/2 top-[42%] z-0 hidden -translate-x-1/2 text-lg text-[var(--sienna)] sm:block"
          style={{ rotate: "-2deg" }}
        >
          then →
        </span>

        <div className="relative grid gap-10 sm:grid-cols-2">
          <DraggablePolaroid
            src={beforePhoto}
            caption="before — as is"
            rotation={-3}
            dragLabel="before"
          />
          <DraggablePolaroid
            src={resultImage ?? style.image}
            caption={`after — ${style.name.toLowerCase()}`}
            rotation={2.5}
            dragLabel="after"
          />
        </div>

        {/* Recommended colour palette — taped paint chips with wall costs */}
        <ColourPalette
          styleId={style.styleId}
          dims={dims}
          pathId={pathId}
        />

        {/* Budget breakdown — ₹ ledger taped beside the polaroids */}
        <BudgetBreakdown
          breakdown={breakdown}
          roomLabel={roomLabel}
          dims={dims}
        />

        {/* The future — how the room is meant to look */}
        <VisionPolaroid
          src={VISION_IMG}
          caption={`the dream — ${style.name.toLowerCase()} done properly`}
        />

        {/* AI notes as a torn paper card */}
        <div
          className="relative mx-auto mt-10 max-w-xl bg-card p-5 paper-shadow"
          style={{ rotate: "1deg" }}
        >
          <WashiTape color="var(--sage)" rotation={4} width="3rem" height="0.9rem" className="-top-2 left-8" />
          <h3 className="font-display text-lg font-bold">what the muse changed</h3>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {[
              `Reworked the palette toward ${style.name}'s warmer, considered tones.`,
              "Suggested layout tweaks that keep your existing furniture footprint.",
              "Matched décor picks to your stated budget, not a generic wishlist.",
            ].map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-hand -mt-0.5 text-lg leading-none text-[var(--terracotta)]">
                  ✦
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onFinish}
            className="font-sans relative inline-flex items-center gap-2 rounded-sm bg-[var(--terracotta)] px-7 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ rotate: "-0.6deg", boxShadow: "3px 4px 0 var(--sienna)" }}
          >
            <Wand2 size={16} />
            save to my mood board →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Studio page ---------------- */
export default function Studio() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [pathId, setPathId] = useState<DesignPathId>("home_decor");
  const [selectedRooms, setSelectedRooms] = useState<RoomTypeId[]>([]);
  const [roomPhotos, setRoomPhotos] = useState<Partial<Record<RoomTypeId, RoomPhoto>>>({});
  const [activeRoom, setActiveRoom] = useState<RoomTypeId | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(DESIGN_STYLES[0]);
  const [details, setDetails] = useState<RoomDetails>({
    length: "",
    width: "",
    height: "",
    budget: 200000,
  });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(92);
  const [realBreakdown, setRealBreakdown] = useState<BudgetBreakdownData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // The room currently driving the single-image analyse/reveal pipeline —
  // whichever room is marked active, falling back to the first selected one.
  const activeRoomId = activeRoom ?? selectedRooms[0] ?? null;
  const activeRoomPhoto = activeRoomId ? roomPhotos[activeRoomId] : undefined;
  const activeRoomLabel = ROOM_TYPES.find((r) => r.id === activeRoomId)?.label ?? "the room";
  const uploadedFile = activeRoomPhoto?.file ?? null;
  const uploadedPhoto = activeRoomPhoto?.previewUrl ?? null;

  /* numeric dims for the palette + ledger (strings → metres) */
  const dimsAsMetres = {
    length: Number(details.length) || 0,
    width: Number(details.width) || 0,
    height: Number(details.height) || 0,
  };

  const handlePath = () => setStep(1);

  const toggleRoom = (room: RoomTypeId) => {
    setSelectedRooms((prev) =>
      prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]
    );
  };

  const setRoomPhoto = (room: RoomTypeId, file: File | null, previewUrl: string) => {
    setRoomPhotos((prev) => {
      const next = { ...prev };
      if (file) {
        next[room] = { file, previewUrl };
        // first photo pinned becomes the active room by default
        setActiveRoom((cur) => cur ?? room);
      } else {
        delete next[room];
        setActiveRoom((cur) => (cur === room ? null : cur));
      }
      return next;
    });
  };

  const handleRoomsFinish = () => setStep(2);

  const startReveal = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setStep(4);
    setErrorMsg(null);
    setRealBreakdown(null);

    // Demo room has no real File — nothing to send, just show the style image
    if (!uploadedFile) {
      setResultImage(selectedStyle.image);
      setProcessing(false);
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("styles", JSON.stringify([selectedStyle.styleId]));
      formData.append("length", details.length || "0");
      formData.append("width", details.width || "0");
      formData.append("height", details.height || "0");
      formData.append("budget", String(details.budget));
      // `pathId` maps directly to the backend's `scope` field — home_decor,
      // interior_design, and full_makeover are the three paths the user
      // picks in step 1, so this is a real (not placeholder) value.
      formData.append("scope", pathId);
      formData.append("room_type", activeRoomId ?? "living_room");
      formData.append("num_rooms", String(selectedRooms.length || 1));
      formData.append("harmony", "analogous");
      formData.append("save", "true");

      const analyseRes = await analyseRoom(formData);
      const result = analyseRes.data.result;

      // Real ₹ budget breakdown from the backend's catalog-driven
      // recommendation engine, when present — replaces the local
      // scaleBudget() estimate below.
      if (result?.recommendations?.budget_breakdown) {
        setRealBreakdown(mapBackendBudget(result.recommendations));
      }

      const genRes = await generateRoomImage({
        style: selectedStyle.styleId,
        analysis: result,
      });

      setResultImage(genRes.data.image_url ?? selectedStyle.image);
      setConfidence(genRes.data.confidence ?? result?.confidence ?? 92);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setErrorMsg("Please sign in to run a design analysis.");
        setAuthOpen(true);
      } else {
        setErrorMsg("Something went wrong generating that room — try again.");
      }
      setResultImage(selectedStyle.image); // fall back so the UI doesn't dead-end
    } finally {
      setProcessing(false);
    }
  };

  // ₹ breakdown: prefer the REAL backend catalog-priced data (set after a
  // successful analyseRoom() call above) — scaleBudget() is only the
  // fallback estimate for the no-file demo path.
  const breakdown = realBreakdown ?? scaleBudget(
    selectedStyle.styleId,
    details.budget,
    pathId,
    details
  );

  return (
    <div className="min-h-screen">
      {/* progress: hand-drawn page markers */}
      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-center gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <button
                onClick={() => i <= step && setStep(i)}
                className="flex items-center gap-2"
                disabled={i > step}
                aria-current={i === step}
              >
                <span
                  className="font-hand flex h-8 w-8 items-center justify-center rounded-full border-2 text-lg"
                  style={{
                    borderColor: i <= step ? "var(--terracotta)" : "var(--border)",
                    background: i <= step ? "var(--terracotta)" : "transparent",
                    color: i <= step ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    rotate: `${(i % 2 === 0 ? -1 : 1) * 2}deg`,
                  }}
                >
                  {i < step ? <Check size={15} /> : i + 1}
                </span>
                <span
                  className={`font-hand text-lg sm:text-xl ${i === step ? "text-[var(--terracotta)]" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="h-px w-8 bg-border sm:w-14" />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="container relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 70% at 20% 10%, oklch(0.92 0.03 80) 0%, transparent 65%)",
          }}
        />
        <DoodleStar className="pointer-events-none absolute right-8 top-10 h-7 w-7 text-[var(--terracotta)]" />

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        >
          {step === 0 && <PathPicker selected={pathId} onChange={setPathId} onFinish={handlePath} />}
          {step === 1 && (
            <RoomTypePicker
              selectedRooms={selectedRooms}
              photos={roomPhotos}
              activeRoom={activeRoomId}
              onToggleRoom={toggleRoom}
              onPhotoChange={setRoomPhoto}
              onSetActive={setActiveRoom}
              onFinish={handleRoomsFinish}
            />
          )}
          {step === 2 && (
            <div className="space-y-10">
              <PinnedPhoto
                src={uploadedPhoto ?? IMG.roomBefore}
                caption={`the ${activeRoomLabel}`}
              />
              <StylePicker selected={selectedStyle} onSelect={setSelectedStyle} uploaded />
              <div className="text-center">
                <button
                  onClick={() => setStep(3)}
                  className="font-sans relative inline-flex items-center gap-2 rounded-sm bg-[var(--terracotta)] px-7 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{ rotate: "0.7deg", boxShadow: "3px 4px 0 var(--sienna)" }}
                >
                  <Wand2 size={16} />
                  that's the one — measurements →
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <RoomDetailsStep details={details} onChange={setDetails} onFinish={startReveal} />
          )}
          {step === 4 && (
            <RevealStep
              onFinish={() => toast.success("Saved to my mood board — go take a look!")}
              breakdown={breakdown}
              dims={dimsAsMetres}
              pathId={pathId}
              style={selectedStyle}
              resultImage={resultImage}
              confidence={confidence}
              processing={processing}
              errorMsg={errorMsg}
              beforePhoto={uploadedPhoto ?? IMG.roomBefore}
              roomLabel={`the ${activeRoomLabel}`}
            />
          )}
        </motion.div>
      </main>
      <TornDivider paper="var(--paper)" flip />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
