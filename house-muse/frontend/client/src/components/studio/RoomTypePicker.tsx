/*
 * HOUSE MUSE — RoomTypePicker
 * New step between "pick the road" and "choose a mood": pick which room(s)
 * are on the table, then pin a photo of each one — matching the paper/
 * polaroid language used everywhere else in the Studio flow.
 *
 * NOTE: today's /api/studio/analyse/ endpoint takes one room_type + one
 * image per call, so only the "active" room (the one currently marked as
 * primary) is sent through the style/measurements/reveal steps that follow.
 * The other pinned photos are kept in state so a future multi-room batch
 * endpoint can pick them up without redoing this UI.
 */
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, UploadCloud, X } from "lucide-react";
import { WashiTape, Pin } from "@/components/aesthetic/Craft";
import { ROOM_TYPES, type RoomTypeId } from "@/lib/mockData";

export interface RoomPhoto {
  file: File | null;
  previewUrl: string;
}

export function RoomTypePicker({
  selectedRooms,
  photos,
  activeRoom,
  onToggleRoom,
  onPhotoChange,
  onSetActive,
  onFinish,
}: {
  selectedRooms: RoomTypeId[];
  photos: Partial<Record<RoomTypeId, RoomPhoto>>;
  activeRoom: RoomTypeId | null;
  onToggleRoom: (room: RoomTypeId) => void;
  onPhotoChange: (room: RoomTypeId, file: File | null, previewUrl: string) => void;
  onSetActive: (room: RoomTypeId) => void;
  onFinish: () => void;
}) {
  const canFinish = selectedRooms.length > 0 && selectedRooms.every((r) => photos[r]);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div
        className="relative rounded-sm bg-card p-6 paper-shadow sm:p-10"
        style={{ rotate: "-0.3deg" }}
      >
        <WashiTape rotation={-9} width="3.6rem" height="1rem" className="-top-2.5 left-10" />
        <WashiTape color="var(--sage)" rotation={10} width="3.6rem" height="1rem" className="-top-2.5 right-10" />

        <h2 className="font-display text-2xl font-bold sm:text-3xl">which rooms are we doing?</h2>
        <p className="font-hand mt-1 text-xl text-[var(--terracotta)]">
          pick as many as you like — pin a photo of each ↓
        </p>

        {/* room checkboxes */}
        <div className="mt-6 flex flex-wrap gap-3">
          {ROOM_TYPES.map((room) => {
            const active = selectedRooms.includes(room.id);
            return (
              <button
                key={room.id}
                onClick={() => onToggleRoom(room.id)}
                aria-pressed={active}
                className={`font-hand flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-lg transition-colors ${
                  active
                    ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10 text-[var(--terracotta)]"
                    : "border-border text-muted-foreground hover:border-[var(--terracotta)]/40"
                }`}
              >
                {active && <Check size={14} />}
                {room.label}
              </button>
            );
          })}
        </div>

        {/* one polaroid upload slot per selected room */}
        <div className="mt-8 flex flex-wrap justify-center gap-8">
          <AnimatePresence>
            {selectedRooms.map((roomId) => {
              const room = ROOM_TYPES.find((r) => r.id === roomId)!;
              const photo = photos[roomId];
              return (
                <motion.div
                  key={roomId}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 160, damping: 18 }}
                >
                  <RoomPolaroidSlot
                    label={room.label}
                    photo={photo}
                    isActive={activeRoom === roomId}
                    onUpload={(file, url) => onPhotoChange(roomId, file, url)}
                    onRemove={() => onPhotoChange(roomId, null, "")}
                    onMakeActive={() => onSetActive(roomId)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {selectedRooms.length > 1 && (
          <p className="font-hand mt-6 text-center text-lg text-[var(--sienna)]">
            the muse works one room at a time — tap a pinned photo to make it the one she starts with
          </p>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={onFinish}
            disabled={!canFinish}
            className="font-sans relative inline-flex items-center gap-2 rounded-sm bg-[var(--terracotta)] px-7 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ rotate: "-0.5deg", boxShadow: "3px 4px 0 var(--sienna)" }}
          >
            that's the room{selectedRooms.length > 1 ? "s" : ""} — next →
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomPolaroidSlot({
  label,
  photo,
  isActive,
  onUpload,
  onRemove,
  onMakeActive,
}: {
  label: string;
  photo?: RoomPhoto;
  isActive: boolean;
  onUpload: (file: File, previewUrl: string) => void;
  onRemove: () => void;
  onMakeActive: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    if (!files[0].type.startsWith("image/")) return;
    onUpload(files[0], URL.createObjectURL(files[0]));
  };

  return (
    <div className="relative w-40 sm:w-48" style={{ rotate: isActive ? "0deg" : "-1.5deg" }}>
      {photo?.previewUrl ? (
        <button
          type="button"
          onClick={onMakeActive}
          className={`relative block w-full rounded-[2px] bg-[var(--paper-cream)] p-2.5 pb-7 paper-shadow transition-shadow ${
            isActive ? "ring-2 ring-[var(--terracotta)]" : ""
          }`}
        >
          <Pin className="left-1/2 -top-2 -translate-x-1/2" />
          <img
            src={photo.previewUrl}
            alt={label}
            className="aspect-square w-full rounded-[1px] object-cover"
          />
          <span
            role="button"
            aria-label={`remove ${label} photo`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X size={12} />
          </span>
          <span className="font-hand absolute bottom-1.5 left-0 right-0 text-center text-base text-[var(--sienna)]">
            {label}
            {isActive ? " ✦" : ""}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[2px] border-2 border-dashed border-[var(--terracotta)]/40 bg-[var(--paper-cream)]/60 p-3 text-center paper-shadow-sm hover:border-[var(--terracotta)]/70"
        >
          <UploadCloud size={22} className="text-[var(--terracotta)]" />
          <span className="font-hand text-base text-[var(--sienna)]">pin the {label}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
