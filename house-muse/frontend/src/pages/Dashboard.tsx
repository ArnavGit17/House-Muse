import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, FolderOpen, Plus, Sparkles } from "lucide-react";
import { getProjects, apiError, type Project } from "../lib/api";

const STYLE_LABELS: Record<string, string> = { vintage_indian: "Vintage Indian", contemporary_indian: "Contemporary Indian", coastal: "Coastal", industrial: "Industrial", scandinavian: "Scandinavian", eclectic: "Eclectic", shabby_chic_style: "Shabby Chic", mid_century_modern: "Mid-century Modern", victorian: "Victorian" };

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProjects()
      .then((data) => { if (!cancelled) setProjects(data); })
      .catch((err) => { if (!cancelled) setError(apiError(err)); });
    return () => { cancelled = true; };
  }, []);

  const loading = projects === null && !error;
  const count = projects?.length ?? 0;

  return <main className="product-page dashboard-page"><div className="dashboard-heading"><div><span className="eyebrow">House Muse / Dashboard</span><h1>Your rooms, held in one place.</h1><p>Saved directions, measured budgets, and the details worth returning to.</p></div><Link href="/studio" className="button primary"><Plus size={16} /> New room</Link></div><section className="dashboard-feature"><div className="feature-copy"><span className="eyebrow">A better blank page</span><h2>Start with one room. Let the rest follow.</h2><p>House Muse turns a photograph, a point of view, and a budget into a direction you can actually make decisions from.</p><Link href="/studio" className="text-link">Open Studio <ArrowUpRight size={15} /></Link></div><img src="/manus-storage/house-muse-studio-preview_0904c280.jpg" alt="Calm bedroom interior" /></section><div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-title"><span><FolderOpen size={16} /> Saved projects</span><span className="status-chip">{loading ? "…" : `${count} room${count === 1 ? "" : "s"}`}</span></div>{error ? <div className="empty-projects"><div className="empty-icon"><Sparkles size={19} /></div><h3>Couldn't load your projects.</h3><p>{error}</p></div> : loading ? <div className="empty-projects"><div className="empty-icon"><Sparkles size={19} /></div><h3>Loading your rooms…</h3></div> : count === 0 ? <div className="empty-projects"><div className="empty-icon"><Sparkles size={19} /></div><h3>Your first room is waiting.</h3><p>Projects from the Studio will appear here once you save a direction.</p><Link href="/studio" className="button ghost">Create a direction</Link></div> : <div className="project-list">{projects!.map((p) => <div className="project-row" key={p.id}><div className="project-thumb">{p.generated_image_url || p.source_image ? <img src={p.generated_image_url || p.source_image} alt={p.name || "Saved room"} /> : <ImagePlaceholder />}</div><div className="project-meta"><b>{p.name || p.room_type?.replaceAll("_", " ") || "Untitled room"}</b><span>{(p.styles || []).map((s) => STYLE_LABELS[s] || s).join(", ")}</span><span>₹{Number(p.budget || 0).toLocaleString("en-IN")}</span></div></div>)}</div>}</section><section className="dashboard-panel material-panel"><div className="panel-title"><span>Material note</span><span className="terracotta-dot" /></div><img src="/manus-storage/house-muse-style-board_490a6f14.jpg" alt="Interior material samples" /><p>Color recommendations are not yet derived from the uploaded photograph. They will be treated as a style-led starting point.</p></section></div></main>;
}

function ImagePlaceholder() {
  return <div className="image-placeholder" style={{ height: "100%" }}><Sparkles size={16} /></div>;
}
