import { useMemo, useRef, useState } from "react";
import { analyse, generateImage, apiError } from "../lib/api";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Ruler, Sparkles, ChevronDown, ChevronUp, Armchair, Lamp, Frame, Palette, Layers, X, ArrowLeftRight } from "lucide-react";

const styles = [["vintage_indian", "Vintage Indian", "Craft, patina, story"], ["contemporary_indian", "Contemporary Indian", "Clean lines, rooted materials"], ["coastal", "Coastal", "Airy, soft, sun-washed"], ["industrial", "Industrial", "Raw, graphic, structural"], ["scandinavian", "Scandinavian", "Light, calm, considered"], ["eclectic", "Eclectic", "Collected, expressive, layered"], ["shabby_chic_style", "Shabby Chic", "Romantic, lived-in, delicate"], ["mid_century_modern", "Mid-century Modern", "Iconic, warm, balanced"], ["victorian", "Victorian", "Ornate, dramatic, timeless"]];
const roomTypes = [["living_room", "Living room"], ["bedroom", "Bedroom"], ["kitchen", "Kitchen"], ["dining_room", "Dining room"], ["bathroom", "Bathroom"], ["study_room", "Study room"]];

const STYLE_CATALOG_INFO: Record<string, { prefix: string; suffix: string; wallpaperName: string }> = {
  scandinavian: { prefix: "Minimalist", suffix: "Japandi", wallpaperName: "Japandi Damask Wallpaper" },
  contemporary_indian: { prefix: "Brass-inlay", suffix: "Contemporary Indian", wallpaperName: "Contemporary Indian Textured Linen Wallpaper" },
  vintage_indian: { prefix: "Hand-carved", suffix: "Vintage Indian", wallpaperName: "Vintage Indian Ikat Weave Wallpaper" },
  coastal: { prefix: "Rattan", suffix: "Coastal", wallpaperName: "Coastal Textured Linen Wallpaper" },
  industrial: { prefix: "Iron-frame", suffix: "Industrial", wallpaperName: "Industrial Block Print Wallpaper" },
  eclectic: { prefix: "Woven", suffix: "Bohemian", wallpaperName: "Bohemian Botanical Wallpaper" },
  shabby_chic_style: { prefix: "Floral-print", suffix: "Cottagecore", wallpaperName: "Cottagecore Textured Linen Wallpaper" },
  mid_century_modern: { prefix: "Walnut", suffix: "Mid-Century Modern", wallpaperName: "Mid-Century Modern Geometric Stripe Wallpaper" },
  victorian: { prefix: "Tufted Velvet", suffix: "Victorian", wallpaperName: "Victorian Brocade Wallpaper" },
};

const CATEGORY_COLORS: Record<string, string> = {
  furniture: "#c0603a",
  wallpaper: "#d49b42",
  curtains: "#76876a",
  rugs: "#bca37f",
  lamps: "#e07a5f",
  wall_art: "#5b6c7a",
  accent: "#9c6d59",
};

const ROOM_MARKERS = [
  { id: 1, top: "25%", left: "48%", category: "wall_art", itemIndex: 0, label: "Wall Art", alignRight: false },
  { id: 2, top: "38%", left: "80%", category: "lamps", itemIndex: 0, label: "Lighting", alignRight: true },
  { id: 3, top: "60%", left: "28%", category: "furniture", itemIndex: 0, label: "Seating", alignRight: false },
  { id: 4, top: "68%", left: "60%", category: "furniture", itemIndex: 1, label: "Table", alignRight: false },
  { id: 5, top: "82%", left: "44%", category: "rugs", itemIndex: 0, label: "Rug", alignRight: false },
];

function ItemThumbnailIcon({ category }: { category: string }) {
  const iconProps = { size: 14, style: { color: "#8a7e72" } };
  switch (category) {
    case "furniture":
      return <Armchair {...iconProps} />;
    case "lamps":
    case "lighting":
      return <Lamp {...iconProps} />;
    case "wall_art":
      return <Frame {...iconProps} />;
    case "wallpaper":
      return <Palette {...iconProps} />;
    case "rugs":
    case "rug":
      return <Layers {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
}

function getCategoryCatalogItems(
  key: string,
  amount: number,
  selectedStyle: string,
  resultData: Record<string, any> | null
): Array<{ name: string; price: number; thumbnail?: string; category: string }> {
  const explicitItems =
    resultData?.budget_breakdown_items?.[key] ||
    resultData?.budget_items?.[key] ||
    resultData?.category_items?.[key] ||
    resultData?.items?.[key];

  if (Array.isArray(explicitItems) && explicitItems.length > 0) {
    return explicitItems.map((item: any) => ({
      name: item.name || "Catalog item",
      price: Number(item.price || 0),
      thumbnail: item.thumbnail || item.image_url || "",
      category: item.category || key,
    }));
  }

  if (key === "wallpaper") {
    const recoWallpapers = resultData?.recommendations?.wallpapers;
    if (Array.isArray(recoWallpapers) && recoWallpapers.length > 0) {
      return [{
        name: recoWallpapers[0].name || "Feature Wallpaper",
        price: amount,
        thumbnail: recoWallpapers[0].image_url || "",
        category: "wallpaper",
      }];
    }
  } else {
    const recoDecor = resultData?.recommendations?.decor_items;
    if (Array.isArray(recoDecor) && recoDecor.length > 0) {
      const matched = recoDecor.filter((d: any) =>
        d.category === key ||
        (key === "curtains" && d.category === "curtain") ||
        (key === "rugs" && d.category === "rug") ||
        (key === "lamps" && d.category === "lighting")
      );
      if (matched.length > 0) {
        return matched.map((m: any) => ({
          name: m.name,
          price: Number(m.price || 0),
          thumbnail: m.image_url || "",
          category: key,
        }));
      }
    }
  }

  const info = STYLE_CATALOG_INFO[selectedStyle] || STYLE_CATALOG_INFO.scandinavian;
  const p = info.prefix;
  const s = info.suffix;

  switch (key) {
    case "wallpaper":
      return [{ name: info.wallpaperName, price: amount, category: "wallpaper" }];
    case "furniture": {
      const seatingPrice = Math.round(amount * 0.3807);
      const tablePrice = Math.round(amount * 0.4338);
      const storagePrice = amount - seatingPrice - tablePrice;
      return [
        { name: `${p} Seating — ${s}`, price: seatingPrice, category: "furniture" },
        { name: `${p} Table — ${s}`, price: tablePrice, category: "furniture" },
        { name: `${p} Storage — ${s}`, price: storagePrice, category: "furniture" },
      ];
    }
    case "curtains":
      return [{ name: `${p} Curtain — ${s}`, price: amount, category: "curtains" }];
    case "rugs":
      return [{ name: `${p} Rug — ${s}`, price: amount, category: "rugs" }];
    case "lamps":
      return [{ name: `${p} Lighting — ${s}`, price: amount, category: "lamps" }];
    case "wall_art":
      return [{ name: `${p} Wall Art — ${s}`, price: amount, category: "wall_art" }];
    case "accent": {
      const mirrorPrice = Math.round(amount * 0.5975);
      const cushionPrice = Math.round(amount * 0.2415);
      const plantPrice = amount - mirrorPrice - cushionPrice;
      return [
        { name: `${p} Mirror — ${s}`, price: mirrorPrice, category: "accent" },
        { name: `${p} Cushion — ${s}`, price: cushionPrice, category: "accent" },
        { name: `${p} Plant — ${s}`, price: plantPrice, category: "accent" },
      ];
    }
    default:
      return [{ name: `${p} ${key.replace("_", " ")} — ${s}`, price: amount, category: key }];
  }
}

function getAlternativesForItem(
  item: { name: string; price: number; thumbnail?: string; category: string },
  category: string,
  selectedStyle: string,
  resultData: Record<string, any> | null
): Array<{ name: string; price: number; thumbnail?: string; category: string; tier: string }> {
  const extraRecommendations: Array<{ name: string; price: number; thumbnail?: string; category: string }> = [];
  if (category === "wallpaper") {
    const walls = resultData?.recommendations?.wallpapers;
    if (Array.isArray(walls)) {
      walls.forEach((w: any) => {
        if (w.name !== item.name) {
          extraRecommendations.push({
            name: w.name,
            price: Number(w.price || item.price * 1.15),
            thumbnail: w.image_url || "",
            category: "wallpaper",
          });
        }
      });
    }
  } else {
    const decors = resultData?.recommendations?.decor_items;
    if (Array.isArray(decors)) {
      decors.forEach((d: any) => {
        const matchesCat =
          d.category === category ||
          (category === "curtains" && d.category === "curtain") ||
          (category === "rugs" && d.category === "rug") ||
          (category === "lamps" && d.category === "lighting");
        if (matchesCat && d.name !== item.name) {
          extraRecommendations.push({
            name: d.name,
            price: Number(d.price || item.price),
            thumbnail: d.image_url || "",
            category,
          });
        }
      });
    }
  }

  const info = STYLE_CATALOG_INFO[selectedStyle] || STYLE_CATALOG_INFO.scandinavian;
  const p = info.prefix;
  const s = info.suffix;
  const basePrice = item.price || 10000;

  const tierConfigs = [
    {
      tier: "Essential",
      priceMultiplier: 0.74,
      nameModifier: (base: string) => {
        const clean = base.includes("—") ? base.split("—")[0].trim().replace(p, "").trim() : base;
        return `${p} Studio ${clean || "Essential"} — Minimalist Edition`;
      },
    },
    {
      tier: "Curated",
      priceMultiplier: 1.08,
      nameModifier: (base: string) => {
        const clean = base.includes("—") ? base.split("—")[0].trim().replace(p, "").trim() : base;
        return `${p} Handcrafted ${clean || "Piece"} — ${s}`;
      },
    },
    {
      tier: "Heritage",
      priceMultiplier: 1.45,
      nameModifier: (base: string) => {
        const clean = base.includes("—") ? base.split("—")[0].trim().replace(p, "").trim() : base;
        return `${p} Atelier ${clean || "Archival"} — Bespoke Selection`;
      },
    },
  ];

  const results: Array<{ name: string; price: number; thumbnail?: string; category: string; tier: string }> = [];

  if (extraRecommendations.length > 0) {
    extraRecommendations.slice(0, 3).forEach((rec, idx) => {
      results.push({
        name: rec.name,
        price: Math.round(rec.price),
        thumbnail: rec.thumbnail || item.thumbnail,
        category,
        tier: idx === 0 ? "Essential" : idx === 1 ? "Curated" : "Heritage",
      });
    });
  }

  tierConfigs.forEach((tc) => {
    if (results.length < 3) {
      const altPrice = Math.round(basePrice * tc.priceMultiplier);
      const altName = tc.nameModifier(item.name);
      if (altName !== item.name && !results.some(r => r.name === altName)) {
        results.push({
          name: altName,
          price: altPrice,
          thumbnail: item.thumbnail,
          category,
          tier: tc.tier,
        });
      }
    }
  });

  return results.slice(0, 3);
}

function DonutChart({
  breakdown,
  total,
  labels,
}: {
  breakdown: Record<string, number>;
  total: number;
  labels: Record<string, string>;
}) {
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const entries = Object.entries(breakdown).filter(([, amt]) => amt > 0);
  let accumulatedPercent = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "14px 0 18px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", borderRadius: "50%" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f0ebe4"
            strokeWidth={strokeWidth}
          />
          {entries.map(([key, amount]) => {
            const pct = total > 0 ? amount / total : 0;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += pct;
            const color = CATEGORY_COLORS[key] || "#8a7e72";

            return (
              <circle
                key={key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                style={{ transition: "stroke-dasharray 0.35s ease, stroke-dashoffset 0.35s ease" }}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a7e72", fontWeight: 600 }}>Total</span>
          <strong style={{ fontSize: 14, fontWeight: 700, color: "#1a1816", marginTop: 1 }}>
            ₹{Math.round(total).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 10px", marginTop: 10, maxWidth: 300 }}>
        {entries.map(([key, amount]) => {
          const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
          const color = CATEGORY_COLORS[key] || "#8a7e72";
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#665e55" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
              <span>{labels[key] || key}</span>
              <strong style={{ fontWeight: 600, color: "#1a1816" }}>{pct}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Studio() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useState("living_room");
  const [scope, setScope] = useState("interior_design");
  const [style, setStyle] = useState("contemporary_indian");
  const [budget, setBudget] = useState("180000");
  const [dimensions, setDimensions] = useState({ length: "18", width: "12", height: "10" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resultData, setResultData] = useState<Record<string, any> | null>(null);
  const [afterImage, setAfterImage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeItems, setActiveItems] = useState<Record<string, Array<{ name: string; price: number; thumbnail?: string; category: string }>> | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [activeAltKey, setActiveAltKey] = useState<string | null>(null);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const chosenStyle = useMemo(() => styles.find(s => s[0] === style)?.[1], [style]);
  const chooseFile = (next: File | undefined) => {
    if (!next || !next.type.startsWith("image/")) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const next = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await analyse({
        room_type: room as any,
        length: Number(dimensions.length) * 0.3048,
        width: Number(dimensions.width) * 0.3048,
        height: Number(dimensions.height) * 0.3048,
        styles: [style as any],
        budget: Number(budget),
        scope: scope as any,
        num_rooms: 1,
        harmony: "analogous",
        save: true,
        image: file || undefined,
      });
      setResultData(res?.result || null);
      try {
        const projectId = res?.project?.id;
        const imgRes = await generateImage({ project_id: projectId, style, room_type: room });
        const url = imgRes?.image_url || imgRes?.variants?.[0]?.image_url;
        if (url) setAfterImage(url);
      } catch { /* falls back to static placeholder */ }
      setDone(true);
    } catch (err) {
      setErrorMsg(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const retry = () => { setErrorMsg(""); };
  const reset = () => {
    setStep(1);
    setDone(false);
    setFile(null);
    setPreview("");
    setResultData(null);
    setAfterImage("");
    setErrorMsg("");
    setExpandedCategories({});
    setActiveItems(null);
    setActiveMarkerId(null);
    setActiveAltKey(null);
  };

  const BUDGET_LABELS: Record<string, string> = {
    furniture: "Furniture",
    wallpaper: "Wallpaper + paint",
    curtains: "Curtains",
    rugs: "Rugs",
    lamps: "Lamps",
    wall_art: "Wall art",
    accent: "Accent",
  };

  const baseBreakdown: Record<string, number> = useMemo(() => {
    if (resultData?.budget_breakdown && Object.keys(resultData.budget_breakdown).length > 0) {
      return resultData.budget_breakdown;
    }
    const totalB = Number(budget) || 180000;
    return {
      furniture: Math.round(totalB * 0.40),
      wallpaper: Math.round(totalB * 0.15),
      curtains: Math.round(totalB * 0.12),
      rugs: Math.round(totalB * 0.10),
      lamps: Math.round(totalB * 0.08),
      wall_art: Math.round(totalB * 0.08),
      accent: Math.round(totalB * 0.07),
    };
  }, [resultData, budget]);

  const currentItemsMap = useMemo(() => {
    if (activeItems) return activeItems;
    const initialMap: Record<string, Array<{ name: string; price: number; thumbnail?: string; category: string }>> = {};
    for (const [catKey, catAmt] of Object.entries(baseBreakdown)) {
      initialMap[catKey] = getCategoryCatalogItems(catKey, Number(catAmt), style, resultData);
    }
    return initialMap;
  }, [activeItems, baseBreakdown, style, resultData]);

  const liveCategorySubtotals = useMemo(() => {
    const subtotals: Record<string, number> = {};
    for (const [catKey, itemsList] of Object.entries(currentItemsMap)) {
      subtotals[catKey] = itemsList.reduce((sum, item) => sum + item.price, 0);
    }
    return subtotals;
  }, [currentItemsMap]);

  const liveTotal = useMemo(() => {
    return Object.values(liveCategorySubtotals).reduce((sum, val) => sum + val, 0);
  }, [liveCategorySubtotals]);

  const handleReplaceItem = (
    categoryKey: string,
    itemIdx: number,
    newItem: { name: string; price: number; thumbnail?: string; category: string }
  ) => {
    setActiveItems(prev => {
      const map = prev ? { ...prev } : { ...currentItemsMap };
      const list = [...(map[categoryKey] || [])];
      list[itemIdx] = newItem;
      return { ...map, [categoryKey]: list };
    });
  };

  if (errorMsg) {
    return (
      <main className="product-page studio-page">
        <div className="loading-orbit">
          <span className="eyebrow">House Muse / Studio</span>
          <div className="orbit-mark"><Sparkles size={27} /></div>
          <h1>That didn't go through.</h1>
          <p>{errorMsg}</p>
          <button className="button primary" onClick={retry} style={{ marginTop: 24 }}>Try again</button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="product-page studio-page">
        <div className="loading-orbit">
          <span className="eyebrow">House Muse / Studio</span>
          <div className="orbit-mark"><Sparkles size={27} /></div>
          <h1>Reading the room.</h1>
          <p>Mapping light, proportion, material, and intention into a considered direction.</p>
          <div className="loading-line"><span /></div>
          <small>Analysis in progress · This usually takes a moment</small>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="product-page studio-page">
        <div className="result-header">
          <div>
            <span className="eyebrow">Studio / Direction ready</span>
            <h1>A room with a point of view.</h1>
            <p>We interpreted your {room.replaceAll("_", " ")} in a {chosenStyle} direction.</p>
          </div>
          <button className="button ghost" onClick={reset}>Start another room</button>
        </div>

        <div className="result-grid">
          <div className="image-panel before">
            {preview ? <img src={preview} alt="Uploaded room" /> : (
              <div className="image-placeholder">
                <ImagePlus size={25} />
                <span>Your room photo</span>
              </div>
            )}
            <b>Before</b>
          </div>

          {/* Part A: After image with interactive numbered markers and popovers */}
          <div className="image-panel after" style={{ position: "relative" }}>
            <img src={afterImage || "/manus-storage/house-muse-editorial-room_559afaf4.jpg"} alt="Generated interior direction" />
            <b>After / Direction</b>
            {!afterImage && (
              <span className="image-note">Preview imagery may be generic while room regeneration is being trained.</span>
            )}

            {ROOM_MARKERS.map(marker => {
              const item = currentItemsMap[marker.category]?.[marker.itemIndex] || currentItemsMap[marker.category]?.[0];
              if (!item) return null;
              const isActive = activeMarkerId === marker.id;

              return (
                <div
                  key={marker.id}
                  style={{
                    position: "absolute",
                    top: marker.top,
                    left: marker.left,
                    transform: "translate(-50%, -50%)",
                    zIndex: isActive ? 40 : 20,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMarkerId(isActive ? null : marker.id);
                    }}
                    aria-label={`Marker ${marker.id}: ${item.name}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isActive ? "var(--terracotta, #b45309)" : "rgba(26, 24, 22, 0.88)",
                      color: "#ffffff",
                      border: "2px solid #ffffff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "0 0 0 4px rgba(180, 83, 9, 0.35), 0 4px 12px rgba(0,0,0,0.35)"
                        : "0 2px 8px rgba(0,0,0,0.3)",
                      transition: "all 0.2s ease",
                      padding: 0,
                    }}
                  >
                    {marker.id}
                  </button>

                  {isActive && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 10px)",
                        left: marker.alignRight ? "auto" : "50%",
                        right: marker.alignRight ? "-12px" : "auto",
                        transform: marker.alignRight ? "none" : "translateX(-50%)",
                        background: "#ffffff",
                        borderRadius: 10,
                        padding: "10px 12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
                        border: "1px solid #e8e2dc",
                        width: 210,
                        zIndex: 50,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a7e72", fontWeight: 700 }}>
                          {BUDGET_LABELS[marker.category] || marker.category} · #{marker.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveMarkerId(null)}
                          style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer", color: "#8a7e72", display: "grid", placeItems: "center" }}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f2ece4", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <ItemThumbnailIcon category={item.category || marker.category} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1816", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }} title={item.name}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--terracotta, #b45309)", marginTop: 3 }}>
                            ₹{Math.round(item.price).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <aside className="breakdown">
            <span className="eyebrow">Budget / ₹{Math.round(liveTotal).toLocaleString("en-IN")}</span>
            <h2>A measured allocation.</h2>

            {/* Part B: Live SVG Donut Chart updated with catalog selections */}
            <DonutChart breakdown={liveCategorySubtotals} total={liveTotal} labels={BUDGET_LABELS} />

            {/* Part B: Line-item list with expandable alternatives, live subtotal recalculation */}
            {Object.entries(currentItemsMap).map(([key, items]) => {
              const subtotal = liveCategorySubtotals[key] || 0;
              const isExpanded = !!expandedCategories[key];
              const pct = liveTotal > 0 ? (subtotal / liveTotal) * 100 : 0;
              const catColor = CATEGORY_COLORS[key] || "var(--terracotta, #b45309)";

              return (
                <div className="budget-category-group" key={key} style={{ marginBottom: 12 }}>
                  <div
                    className="budget-row"
                    onClick={() => toggleCategory(key)}
                    style={{ cursor: "pointer", userSelect: "none", margin: "12px 0 6px" }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCategory(key); } }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isExpanded ? <ChevronUp size={13} style={{ color: "#8a7e72" }} /> : <ChevronDown size={13} style={{ color: "#8a7e72" }} />}
                      {BUDGET_LABELS[key] || key}
                      <span style={{ fontSize: 10, color: "#9a8f83", background: "#f2ece4", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </span>
                    <strong>₹{Math.round(subtotal).toLocaleString("en-IN")}</strong>
                    <i><em style={{ width: `${pct}%`, background: catColor }} /></i>
                  </div>

                  {isExpanded && (
                    <div style={{ background: "#faf7f4", borderRadius: 8, padding: "10px 12px", border: "1px solid #eee8e2", marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {items.map((item, idx) => {
                          const itemKey = `${key}-${idx}`;
                          const isSelectedForAlt = activeAltKey === itemKey;
                          const alternatives = isSelectedForAlt ? getAlternativesForItem(item, key, style, resultData) : [];

                          return (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div
                                onClick={() => setActiveAltKey(isSelectedForAlt ? null : itemKey)}
                                role="button"
                                tabIndex={0}
                                aria-expanded={isSelectedForAlt}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setActiveAltKey(isSelectedForAlt ? null : itemKey);
                                  }
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  fontSize: 11,
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  background: isSelectedForAlt ? "#f2ece4" : "transparent",
                                  transition: "background 0.15s ease",
                                  border: isSelectedForAlt ? "1px solid #e0d7cd" : "1px solid transparent",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 5, background: "#ece5dc", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
                                    {item.thumbnail ? (
                                      <img src={item.thumbnail} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <ItemThumbnailIcon category={item.category || key} />
                                    )}
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                    <span style={{ color: "#3d3833", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                                      {item.name}
                                    </span>
                                    <span style={{ fontSize: 9, color: "#8a7e72", display: "flex", alignItems: "center", gap: 3 }}>
                                      <ArrowLeftRight size={9} /> Tap to see alternatives
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                  <span style={{ fontWeight: 600, color: "#1a1816", whiteSpace: "nowrap" }}>
                                    ₹{Math.round(item.price).toLocaleString("en-IN")}
                                  </span>
                                  <ChevronDown
                                    size={12}
                                    style={{
                                      color: "#8a7e72",
                                      transform: isSelectedForAlt ? "rotate(180deg)" : "none",
                                      transition: "transform 0.2s ease",
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Alternatives Drawer */}
                              {isSelectedForAlt && (
                                <div
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #e5ded7",
                                    borderRadius: 7,
                                    padding: "8px 10px",
                                    margin: "2px 0 6px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a7e72" }}>
                                      Select Alternative ({alternatives.length} price points)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveAltKey(null);
                                      }}
                                      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "#9a8f83" }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                    {alternatives.map((alt, aIdx) => {
                                      const diff = alt.price - item.price;
                                      const isCurrent = alt.name === item.name;
                                      return (
                                        <div
                                          key={aIdx}
                                          onClick={() => {
                                            handleReplaceItem(key, idx, {
                                              name: alt.name,
                                              price: alt.price,
                                              thumbnail: alt.thumbnail || item.thumbnail,
                                              category: key,
                                            });
                                            setActiveAltKey(null);
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "6px 8px",
                                            borderRadius: 5,
                                            border: isCurrent ? "1px solid var(--terracotta, #b45309)" : "1px solid #eee8e2",
                                            background: isCurrent ? "#fdf8f4" : "#faf7f4",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                          }}
                                          role="button"
                                          tabIndex={0}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              handleReplaceItem(key, idx, {
                                                name: alt.name,
                                                price: alt.price,
                                                thumbnail: alt.thumbnail || item.thumbnail,
                                                category: key,
                                              });
                                              setActiveAltKey(null);
                                            }
                                          }}
                                        >
                                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, paddingRight: 6 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                              <span
                                                style={{
                                                  fontSize: 8,
                                                  fontWeight: 700,
                                                  textTransform: "uppercase",
                                                  padding: "1px 4px",
                                                  borderRadius: 3,
                                                  background: alt.tier === "Essential" ? "#e6f0fa" : alt.tier === "Heritage" ? "#faede6" : "#f0ede6",
                                                  color: alt.tier === "Essential" ? "#1e5b94" : alt.tier === "Heritage" ? "#9c4217" : "#595248",
                                                }}
                                              >
                                                {alt.tier}
                                              </span>
                                              <span style={{ fontSize: 10, fontWeight: 500, color: "#2d2620", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={alt.name}>
                                                {alt.name}
                                              </span>
                                            </div>
                                          </div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                            <div style={{ textAlign: "right" }}>
                                              <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1816" }}>
                                                ₹{Math.round(alt.price).toLocaleString("en-IN")}
                                              </div>
                                              {diff !== 0 && (
                                                <div style={{ fontSize: 8, fontWeight: 600, color: diff > 0 ? "#b45309" : "#2d7a4d" }}>
                                                  {diff > 0 ? `+₹${Math.round(diff).toLocaleString("en-IN")}` : `-₹${Math.round(Math.abs(diff)).toLocaleString("en-IN")}`}
                                                </div>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              style={{
                                                padding: "3px 7px",
                                                fontSize: 9,
                                                fontWeight: 600,
                                                borderRadius: 4,
                                                background: isCurrent ? "#eae3dc" : "var(--terracotta, #b45309)",
                                                color: isCurrent ? "#554e46" : "#ffffff",
                                                border: "none",
                                                cursor: "pointer",
                                              }}
                                            >
                                              {isCurrent ? "Current" : "Select"}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #ded7cf", paddingTop: 6, fontSize: 11 }}>
                        <span style={{ color: "#7a7065", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10, fontWeight: 600 }}>Category Subtotal</span>
                        <strong style={{ color: "var(--terracotta, #b45309)", fontWeight: 600 }}>
                          ₹{Math.round(subtotal).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <p className="fine-print">
              Interactive allocation: tap any item to explore price-tier alternatives, preview live rebalanced totals, and inspect room markers.
            </p>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="product-page studio-page">
      <div className="studio-top">
        <div>
          <span className="eyebrow">House Muse / Studio</span>
          <h1>Give the room a point of view.</h1>
        </div>
        <Link href="/" className="back-link"><ArrowLeft size={15} /> Exit studio</Link>
      </div>

      <div className="studio-layout">
        <aside className="steps">
          {["Upload", "Room details", "Style", "Budget"].map((label, i) => (
            <div className={step === i + 1 ? "step active" : step > i + 1 ? "step complete" : "step"} key={label}>
              <span>{step > i + 1 ? <Check size={14} /> : `0${i + 1}`}</span>
              <b>{label}</b>
            </div>
          ))}
          <div className="studio-aside-note">
            <Ruler size={17} />
            <p>Every recommendation begins with the dimensions of your actual room.</p>
          </div>
        </aside>

        <section className="studio-form">
          {step === 1 && (
            <div className="form-section">
              <span className="eyebrow">01 / The starting point</span>
              <h2>Show us the room as it is.</h2>
              <p className="section-copy">One photograph is enough to begin. Natural light works best, but lived-in is welcome.</p>
              <div
                className="upload-zone"
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); chooseFile(e.dataTransfer.files[0]); }}
              >
                {preview ? (
                  <img src={preview} alt="Room preview" />
                ) : (
                  <>
                    <ImagePlus size={27} />
                    <strong>Drop a room photo here</strong>
                    <span>Choose an image from your device</span>
                    <button type="button" className="browse-button" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>Browse files</button>
                  </>
                )}
                <input className="native-file-input" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={e => chooseFile(e.target.files?.[0])} />
              </div>
              {file && (
                <div className="file-chip">
                  <Check size={15} /> {file.name}
                  <button onClick={() => { setFile(null); setPreview(""); }}>Remove</button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <span className="eyebrow">02 / The coordinates</span>
              <h2>Tell us what we’re working with.</h2>
              <p className="section-copy">Dimensions are entered in feet and translated to metres for analysis.</p>
              <div className="field-grid three">
                <label>Length <input type="number" value={dimensions.length} onChange={e => setDimensions({ ...dimensions, length: e.target.value })} min="1" /><span>ft</span></label>
                <label>Width <input type="number" value={dimensions.width} onChange={e => setDimensions({ ...dimensions, width: e.target.value })} min="1" /><span>ft</span></label>
                <label>Height <input type="number" value={dimensions.height} onChange={e => setDimensions({ ...dimensions, height: e.target.value })} min="1" /><span>ft</span></label>
              </div>
              <label className="field-label">
                Room type
                <select value={room} onChange={e => setRoom(e.target.value)}>
                  {roomTypes.map(([id, name]) => <option value={id} key={id}>{name}</option>)}
                </select>
              </label>
              <label className="field-label">
                Scope
                <select value={scope} onChange={e => setScope(e.target.value)}>
                  <option value="home_decor">Home decor</option>
                  <option value="interior_design">Interior design</option>
                  <option value="full_makeover">Full makeover</option>
                </select>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="form-section">
              <span className="eyebrow">03 / The atmosphere</span>
              <h2>Choose a language for the room.</h2>
              <p className="section-copy">Pick one direction now. You can refine the details once the first read is ready.</p>
              <div className="style-grid">
                {styles.map(([id, name, desc]) => (
                  <button className={style === id ? "style-option selected" : "style-option"} key={id} onClick={() => setStyle(id)}>
                    <span>{name}</span>
                    <small>{desc}</small>
                    {style === id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-section">
              <span className="eyebrow">04 / The boundary</span>
              <h2>Give the idea a budget.</h2>
              <p className="section-copy">A real number gives every recommendation a useful point of view.</p>
              <div className="budget-display">
                <span>₹</span>
                <input value={budget} onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
                <small>INR total budget</small>
              </div>
              <input className="range" type="range" min="50000" max="600000" step="10000" value={budget} onChange={e => setBudget(e.target.value)} />
              <div className="range-labels">
                <span>₹50,000</span>
                <span>₹6,00,000</span>
              </div>
              <div className="save-note">
                <span className="dot" />
                <div>
                  <b>Save this direction to your dashboard</b>
                  <p>You can revisit the brief and catalog recommendations later.</p>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 ? (
              <button className="button ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={15} /> Back
              </button>
            ) : <span />}
            <button className="button primary" onClick={next}>
              {step === 4 ? "Analyse my room" : "Continue"}
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
