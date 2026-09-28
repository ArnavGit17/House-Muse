/* House Muse / Architectural Intelligence — a cinematic bungalow threshold that reveals room directions through gesture. */
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, DoorOpen, MoveRight, Sparkles } from "lucide-react";

const scenes = [
  {
    id: "entry",
    kicker: "The threshold",
    title: "Step into a better point of view.",
    copy: "Move through the door. House Muse will dress the rooms as you go, one considered direction at a time.",
    image: "/images/lawn.jpg",
    treatment: "A bungalow with room to become",
  },
  {
    id: "living",
    kicker: "01 / Living room",
    title: "Let the living room lead.",
    copy: "Warm teak, terracotta light, and the pieces that make an everyday room feel quietly yours.",
    image: "/images/livingroom.jpg",
    treatment: "Teak · Clay · Woven texture",
    palette: ["#ba704e", "#d6bd9f", "#4c4035"],
  },
  {
    id: "kitchen",
    kicker: "02 / Kitchen",
    title: "Make the practical beautiful.",
    copy: "A kitchen direction with material rhythm: oak, stone, brass, and a place for everything worth keeping.",
    image: "/images/kitchen.jpg",
    treatment: "Oak · Ivory stone · Fired tile",
    palette: ["#b85b42", "#e2d7c6", "#bd9867"],
  },
  {
    id: "bedroom",
    kicker: "03 / Bedroom",
    title: "Leave room for quiet.",
    copy: "Soft linen, walnut, and a low-lit palette designed to make the end of the day feel like an arrival.",
    image: "/images/bedroom.jpg",
    treatment: "Linen · Walnut · Muted clay",
    palette: ["#9d6b58", "#ddd0be", "#624c40"],
  },
  {
    id: "dining",
    kicker: "04 / Dining room",
    title: "Make room for gathering.",
    copy: "A dining room with a generous table, warm light, and materials that make every meal feel intentional.",
    image: "/images/diningroom.jpg",
    treatment: "Oak · Linen · Candlelight",
    palette: ["#a9694e", "#e1cdb5", "#534238"],
  },
  {
    id: "bathroom",
    kicker: "05 / Bathroom",
    title: "Give the everyday a softer edge.",
    copy: "Stone, brushed metal, and quiet morning light composed into a room that feels restorative.",
    image: "/images/bathroom.jpg",
    treatment: "Stone · Brushed brass · Soft light",
    palette: ["#9a806f", "#ded6ca", "#6e5a4e"],
  },
];

const metrics = [["3", "rooms to begin"], ["9", "style languages"], ["1", "photo to start"], ["∞", "ways to make it yours"]];

export default function Home() {
  const [scene, setScene] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 50, tiltX: 0, tiltY: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const wheelLock = useRef(false);
  const active = scenes[scene];
  const goTo = (next: number) => setScene(Math.max(0, Math.min(scenes.length - 1, next)));

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (wheelLock.current || Math.abs(event.deltaY) < 8) return;
      wheelLock.current = true;
      goTo(scene + (event.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => { wheelLock.current = false; }, 650);
    };
    const onKey = (event: KeyboardEvent) => { if (["ArrowDown", "PageDown", " "].includes(event.key)) { event.preventDefault(); goTo(scene + 1); } if (["ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); goTo(scene - 1); } };
    window.addEventListener("wheel", onWheel, { passive: false }); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey); };
  }, [scene]);

  return <main className="house-hero" onPointerMove={event => { setPointer({ x: (event.clientX / window.innerWidth) * 100, y: (event.clientY / window.innerHeight) * 100, tiltX: ((event.clientX / window.innerWidth) - .5) * -4, tiltY: ((event.clientY / window.innerHeight) - .5) * 3 }); setIsMoving(true); }} onPointerLeave={() => setIsMoving(false)} style={{ "--pointer-x": `${pointer.x}%`, "--pointer-y": `${pointer.y}%`, "--tilt-x": `${pointer.tiltX}deg`, "--tilt-y": `${pointer.tiltY}deg` } as React.CSSProperties}>
    <div className="house-scenes" aria-hidden="true">{scenes.map((item, index) => <div className={`house-scene ${scene === index ? "active" : ""}`} key={item.id} style={{ backgroundImage: `url(${item.image})` }} />)}</div>
    <div className="house-vignette" aria-hidden="true" /><div className={isMoving ? "cursor-light moving" : "cursor-light"} aria-hidden="true" />
<div className="house-annotation top-right"><span>Scroll to enter</span><MoveRight size={15} /></div>
    <div className="house-copy"><span className="scene-kicker">{active.kicker}</span><h1>{active.title}</h1><p>{active.copy}</p>{scene === 0 ? <button className="door-cta" onClick={() => goTo(1)}><span className="door-icon"><DoorOpen size={18} /></span><span>Enter the house</span><ArrowRight size={16} /></button> : <div className="treatment-note"><Sparkles size={15} /><span>Applied direction<br /><b>{active.treatment}</b></span></div>}</div>

    {scene > 0 && <div className="room-treatment"><span className="treatment-label">House Muse / Automatic treatment</span><div className="treatment-rule" /><div className="treatment-palette">{active.palette?.map(color => <span style={{ background: color }} key={color} />)}</div></div>}
<div className="scroll-cue"><ArrowDown size={16} /><span>{scene === scenes.length - 1 ? "Return to entry" : "Scroll to move through the rooms"}</span></div>
  </main>;
}
