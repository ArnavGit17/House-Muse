import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, FolderOpen, Plus, Sparkles, Maximize2, Compass, Layers, Palette, CheckCircle2 } from "lucide-react";
import { getProjects, apiError, type Project } from "../lib/api";

const STYLE_LABELS: Record<string, string> = {
  vintage_indian: "Vintage Indian",
  contemporary_indian: "Contemporary Indian",
  coastal: "Coastal",
  industrial: "Industrial",
  scandinavian: "Scandinavian Japandi",
  eclectic: "Eclectic Bohemian",
  shabby_chic_style: "Shabby Chic",
  mid_century_modern: "Mid-Century Modern",
  victorian: "Victorian Elegance",
};

// Curated sample rooms to display if user has not yet saved projects or is browsing
const CURATED_SHOWCASE = [
  {
    id: "sample-1",
    name: "The Teak Living Pavilion",
    room_type: "living_room",
    style: "contemporary_indian",
    budget: 320000,
    dimensions: "18 × 14 × 10 ft",
    image: "/images/livingroom.jpg",
    palette: ["#2B2420", "#8A9A5B", "#E8E2D5", "#C0603A"],
  },
  {
    id: "sample-2",
    name: "Linen & Walnut Sanctuary",
    room_type: "bedroom",
    style: "scandinavian",
    budget: 240000,
    dimensions: "16 × 13 × 9.5 ft",
    image: "/images/bedroom.jpg",
    palette: ["#1F1A17", "#9EAE6F", "#F3EEE4", "#BCA37F"],
  },
  {
    id: "sample-3",
    name: "Ivory Stone Gathering Hall",
    room_type: "dining_room",
    style: "mid_century_modern",
    budget: 280000,
    dimensions: "15 × 12 × 10 ft",
    image: "/images/diningroom.jpg",
    palette: ["#3D342F", "#75844D", "#FAF7F2", "#5B6C7A"],
  },
];

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) setError(apiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = projects === null && !error;
  const count = projects?.length ?? 0;

  return (
    <main className="product-page dashboard-page">
      {/* Editorial Header inspired by OURA & CO / Wood City */}
      <section className="dashboard-hero-header">
        <div className="header-meta">
          <span className="eyebrow section-label">House Muse · Spatial Archives</span>
          <h1 className="headline-serif text-headline">
            Designed Around Real Living.
          </h1>
          <p className="hero-subhead">
            Quiet luxury, everyday. A sense of calm, balance, and refinement that becomes part of your daily life.
          </p>
        </div>
        <div className="header-actions-group">
          <Link href="/studio" className="button primary shadow-sm">
            <Plus size={16} /> New Room Brief
          </Link>
        </div>
      </section>

      {/* Main Architectural Bento Grid inspired directly by OURA & CO and Wood City */}
      <section className="arch-bento-grid">
        {/* Left Feature Card with Wood City Crosshairs and Translucent Olive Badge */}
        <div className="arch-bento-feature">
          <div className="arch-grid-crosshair top-left" aria-hidden="true">+</div>
          <div className="arch-grid-crosshair top-right" aria-hidden="true">+</div>
          <div className="arch-grid-crosshair bottom-left" aria-hidden="true">+</div>
          <div className="arch-grid-crosshair bottom-right" aria-hidden="true">+</div>

          <img
            src="/images/livingroom.jpg"
            alt="Warm architectural living room interior"
            className="feature-img"
          />

          <div className="feature-overlay-top">
            <span className="arch-badge-olive">
              WE DESIGN THE FEELING OF YOU
            </span>
          </div>

          <div className="feature-overlay-bottom">
            <div className="feature-meta">
              <span className="feature-tag">Featured Interior Study</span>
              <h2 className="feature-title">The Teak Pavilion / Living Room</h2>
              <p className="feature-desc">
                Crafted teak, natural limestone, and warm southern light composed into a tranquil gathering space.
              </p>
            </div>
            <Link href="/studio" className="feature-cta-pill">
              Explore Direction <ArrowUpRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            className="floating-expand-btn"
            aria-label="Expand living room study"
            title="Expand image"
            onClick={() => window.open("/images/livingroom.jpg", "_blank")}
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Right Bento Quadrant: OURA & CO Stats & Espresso Quote Card */}
        <div className="arch-bento-stats-column">
          {/* Stat Box 1 */}
          <div className="arch-stat-box">
            <div className="stat-content">
              <span className="stat-num">09</span>
              <p className="stat-copy">
                Architectural design languages from contemporary Indian to Japandi and Mid-Century.
              </p>
            </div>
            <div className="stat-sub">
              <span>Catalog Diversity</span>
              <Palette size={14} className="text-[#8A9A5B]" />
            </div>
          </div>

          {/* Stat Box 2 */}
          <div className="arch-stat-box">
            <div className="stat-content">
              <span className="stat-num">{count > 0 ? (count < 10 ? `0${count}` : count) : "03"}</span>
              <p className="stat-copy">
                {count > 0
                  ? "Rooms actively measured, allocated, and curated in your portfolio."
                  : "Curated architectural showroom rooms available for inspiration."}
              </p>
            </div>
            <div className="stat-sub">
              <span>Personal Collection</span>
              <FolderOpen size={14} className="text-[#8A9A5B]" />
            </div>
          </div>

          {/* Stat Box 3 */}
          <div className="arch-stat-box">
            <div className="stat-content">
              <span className="stat-num">100%</span>
              <p className="stat-copy">
                Proportion-true catalog allocations mapped to your exact wall and ceiling heights.
              </p>
            </div>
            <div className="stat-sub">
              <span>Precision Measurement</span>
              <Compass size={14} className="text-[#8A9A5B]" />
            </div>
          </div>

          {/* Inspo 1: Deep Espresso Accent Card */}
          <div className="arch-espresso-card">
            <div className="espresso-quote-icon">“</div>
            <p className="espresso-quote-text">
              Design isn't just what you see — it's how a space lives with you.
            </p>
            <div className="espresso-card-footer">
              <Link href="/studio" className="espresso-card-link">
                Enter Design Studio <ArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                className="espresso-icon-btn"
                onClick={() => window.open("/images/bedroom.jpg", "_blank")}
                title="View sanctuary room"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Saved Projects Gallery / Architectural Collection */}
      <section className="dashboard-gallery-section">
        <div className="gallery-header">
          <div>
            <span className="eyebrow section-label">Your Spatial Portfolio</span>
            <h2 className="headline-serif text-espresso text-2xl md:text-3xl">
              Saved Rooms & Measurements
            </h2>
          </div>
          <div className="gallery-badge">
            <FolderOpen size={15} />
            <span>
              {loading ? "Scanning archive..." : `${count} Room${count === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {error ? (
          <div className="editorial-empty-card">
            <div className="empty-glyph"><Sparkles size={20} /></div>
            <h3 className="headline-serif text-espresso">Unable to reach the room archive</h3>
            <p>{error}</p>
            <Link href="/studio" className="button ghost mt-4">Open Studio Directly</Link>
          </div>
        ) : loading ? (
          <div className="editorial-empty-card">
            <div className="empty-glyph animate-spin"><Sparkles size={20} /></div>
            <h3 className="headline-serif text-espresso">Retrieving your measured rooms...</h3>
          </div>
        ) : count === 0 ? (
          <div>
            <div className="editorial-empty-card mb-8">
              <div className="empty-glyph"><Sparkles size={22} /></div>
              <h3 className="headline-serif text-espresso text-xl">Your first room is waiting to be shaped.</h3>
              <p className="text-sm max-w-md mx-auto text-[#655E57] mb-5">
                Every direction begins with a photograph and a budget. Below are curated architectural studies to inspire your next space.
              </p>
              <Link href="/studio" className="button primary inline-flex items-center gap-2">
                <Plus size={16} /> Begin in the Studio
              </Link>
            </div>

            {/* Showcase Cards */}
            <div className="showcase-grid">
              {CURATED_SHOWCASE.map((item) => (
                <article className="room-card" key={item.id}>
                  <div className="room-card-media">
                    <img src={item.image} alt={item.name} />
                    <span className="room-type-tag">{item.room_type.replace("_", " ")}</span>
                    <button
                      type="button"
                      className="floating-expand-btn"
                      aria-label="Expand image"
                      onClick={() => window.open(item.image, "_blank")}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                  <div className="room-card-body">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="room-card-title">{item.name}</h3>
                      <span className="style-chip">{STYLE_LABELS[item.style] || item.style}</span>
                    </div>
                    <div className="room-specs-row">
                      <span>Dimensions: <b>{item.dimensions}</b></span>
                      <span>Budget: <b>₹{item.budget.toLocaleString("en-IN")}</b></span>
                    </div>
                    <div className="palette-row">
                      {item.palette.map((color, cIdx) => (
                        <span key={cIdx} className="palette-dot" style={{ background: color }} title={color} />
                      ))}
                      <span className="palette-label">Material Swatches</span>
                    </div>
                    <Link href="/studio" className="room-card-action">
                      Recreate in Studio <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="showcase-grid">
            {projects!.map((p) => {
              const displayImage = p.generated_image_url || p.source_image || "/images/livingroom.jpg";
              const primaryStyle = p.styles?.[0] || "contemporary_indian";
              const formattedBudget = Number(p.budget || 0).toLocaleString("en-IN");
              const dimStr = p.length && p.width ? `${p.length} × ${p.width} × ${p.height || 10} ft` : "Custom coordinates";

              return (
                <article className="room-card" key={p.id}>
                  <div className="room-card-media">
                    <img src={displayImage} alt={p.name || "Room project"} />
                    <span className="room-type-tag">{(p.room_type || "Room").replace("_", " ")}</span>
                    <button
                      type="button"
                      className="floating-expand-btn"
                      aria-label="Expand room photo"
                      onClick={() => window.open(displayImage, "_blank")}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                  <div className="room-card-body">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="room-card-title">{p.name || (p.room_type?.replaceAll("_", " ") || "Untitled Sanctuary")}</h3>
                      <span className="style-chip">{STYLE_LABELS[primaryStyle] || primaryStyle}</span>
                    </div>
                    <div className="room-specs-row">
                      <span>Dimensions: <b>{dimStr}</b></span>
                      <span>Budget: <b>₹{formattedBudget}</b></span>
                    </div>
                    <div className="project-status-row">
                      <span className="status-indicator">
                        <CheckCircle2 size={13} className="text-[#8A9A5B]" /> Analysis Complete
                      </span>
                    </div>
                    <Link href="/studio" className="room-card-action">
                      Revisit Direction <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Material & Tactile Palette Board Section */}
      <section className="material-rhythm-section">
        <div className="material-rhythm-card">
          <div className="material-rhythm-copy">
            <span className="eyebrow section-label text-[#8A9A5B]">Architectural Foundation</span>
            <h2 className="headline-serif text-espresso text-2xl md:text-3xl mb-3">
              The Tactile Rhythm
            </h2>
            <p className="text-[#655E57] text-sm leading-relaxed mb-6">
              House Muse pairs every space with an intentional balance of light, warm timber, natural limestone travertine, and woven fiber.
            </p>
            <div className="swatch-deck">
              <div className="swatch-item">
                <span className="swatch-color" style={{ background: "#F5F2EB" }} />
                <span className="swatch-name">Travertine</span>
                <span className="swatch-hex">#F5F2EB</span>
              </div>
              <div className="swatch-item">
                <span className="swatch-color" style={{ background: "#201915" }} />
                <span className="swatch-name">Deep Teak</span>
                <span className="swatch-hex">#201915</span>
              </div>
              <div className="swatch-item">
                <span className="swatch-color" style={{ background: "#8A9A5B" }} />
                <span className="swatch-name">Moss Olive</span>
                <span className="swatch-hex">#8A9A5B</span>
              </div>
              <div className="swatch-item">
                <span className="swatch-color" style={{ background: "#A85832" }} />
                <span className="swatch-name">Terracotta</span>
                <span className="swatch-hex">#A85832</span>
              </div>
              <div className="swatch-item">
                <span className="swatch-color" style={{ background: "#DFD7CB" }} />
                <span className="swatch-name">Raw Linen</span>
                <span className="swatch-hex">#DFD7CB</span>
              </div>
            </div>
          </div>
          <div className="material-rhythm-media">
            <div className="arch-grid-crosshair top-left" aria-hidden="true">+</div>
            <div className="arch-grid-crosshair bottom-right" aria-hidden="true">+</div>
            <img src="/images/kitchen.jpg" alt="Natural kitchen materials and stone surfaces" />
            <button
              type="button"
              className="floating-expand-btn"
              aria-label="Expand material sample"
              onClick={() => window.open("/images/kitchen.jpg", "_blank")}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
