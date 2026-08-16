/*
 * HOUSE MUSE — Site navigation
 * Style: "The Design Journal". The nav is a paper strip taped to the top of
 * the page; the wordmark uses Fraunces with a leaf mark; theme toggle is a
 * sun/moon pin. Nav items read like index tabs on a sketchbook.
 */
import { Link, useLocation } from "wouter";
import { Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { IMG } from "@/lib/mockData";
import { WashiTape } from "@/components/aesthetic/Craft";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/board", label: "Mood Board" },
];

export default function SiteNav() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="container relative mx-auto max-w-6xl px-4 pt-3">
        <nav
          className={cn(
            "relative flex items-center justify-between",
            "rounded-sm bg-card/95 px-4 py-2.5 backdrop-blur-sm sm:px-6",
            "paper-shadow"
          )}
          style={{ rotate: "-0.4deg" }}
        >
          <WashiTape
            rotation={-12}
            width="3.2rem"
            height="1rem"
            className="-top-2.5 left-8"
          />
          <WashiTape
            rotation={10}
            width="3.2rem"
            height="1rem"
            className="-top-2.5 right-10"
          />

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <img
              src={IMG.logo}
              alt="House Muse"
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
              style={{ rotate: "-3deg" }}
            />
            <span className="font-display whitespace-nowrap text-xl font-bold tracking-tight sm:text-2xl">
              House<span className="text-[var(--terracotta)]"> Muse</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-sans rounded-sm px-2.5 py-1.5 text-sm font-semibold transition-colors sm:px-3 sm:text-base",
                    active
                      ? "bg-[var(--terracotta)] text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  )}
                  style={{ rotate: active ? "-1deg" : "0.6deg" }}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onClick={toggleTheme}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <button
                onClick={signOut}
                className="font-sans rounded-sm px-2.5 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="font-sans rounded-sm bg-[var(--terracotta)] px-2.5 py-1.5 text-sm font-bold text-primary-foreground sm:px-3"
              >
                Sign in
              </button>
            )}
          </div>
        </nav>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
