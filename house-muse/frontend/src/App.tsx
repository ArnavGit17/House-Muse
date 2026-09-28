import { Switch, Route, Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import "./index.css";

function AnimatedBackground() {
  return (
    <div
      className="animated-background animate-bg-drift"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundImage: "url('/images/brand/bg-texture.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const isLanding = location === "/";
  const links = [
    ["Home", "/"],
    ["Studio", "/studio"],
    ["Dashboard", "/dashboard"],
  ];

  return (
    <div
      className={isLanding ? "app landing-app" : "app product-app"}
      style={!isLanding ? { background: "transparent" } : undefined}
    >
      {!isLanding && <AnimatedBackground />}

      <header className="site-header">
        <Link href="/" className="brand-lockup" aria-label="House Muse home"><span className="brand-mark"><img src="/manus-storage/house-muse-chic-mark_49fd4ade.png" alt="" /></span><span className="wordmark">HOUSE MUSE</span></Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className={location === href ? "active" : ""}>{label}</Link>)}
        </nav>
        <Link href="/auth?mode=login" className="signin-link">Sign in</Link>
        <button className={open ? "menu-toggle open" : "menu-toggle"} aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </header>
      {open && <><button className="mobile-overlay" aria-label="Close menu" onClick={() => setOpen(false)} /><nav className="mobile-sheet">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={location === href ? "active" : ""}>{label}</Link>)}<Link href="/auth?mode=login" onClick={() => setOpen(false)} className="sheet-signin">Sign in</Link></nav></>}
      {children}
    </div>
  );
}

function NotFound() { return <main className="product-page"><div className="empty-state"><span className="eyebrow">404 / Unmapped room</span><h1>This corner is still being measured.</h1><Link href="/" className="button primary">Back to the beginning</Link></div></main>; }

export default function App() {
  return <Shell><Switch><Route path="/" component={Home} /><Route path="/studio" component={Studio} /><Route path="/dashboard" component={Dashboard} /><Route path="/auth" component={Auth} /><Route path="/reset-password/:uid/:token" component={Auth} /><Route component={NotFound} /></Switch></Shell>;
}
