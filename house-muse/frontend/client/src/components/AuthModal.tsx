/*
 * HOUSE MUSE — Sign in
 * Reuses the project's own washi-tape/paper-shadow language so this reads
 * as part of the journal, not a bolted-on generic modal.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { WashiTape, DoodleStar } from "@/components/aesthetic/Craft";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: any;
  }
}

/*
 * DRF returns 400s shaped like { "password": ["This password is too short..."],
 * "username": ["A user with that username already exists."] } — read the first
 * real field error instead of showing a generic string that hides the reason.
 */
function parseAuthError(err: any, mode: "login" | "register"): string {
  const data = err?.response?.data;
  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];
    const message = Array.isArray(firstVal) ? firstVal[0] : firstVal;
    if (typeof message === "string") {
      // "detail" is the generic DRF key (e.g. invalid login) — show as-is,
      // otherwise prefix with the field name so it's clear what to fix
      return firstKey === "detail" || firstKey === "non_field_errors"
        ? message
        : `${firstKey}: ${message}`;
    }
  }
  return mode === "login" ? "Couldn't sign you in — check your details." : "Couldn't create that account.";
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { loginWithPassword, registerWithPassword, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        setBusy(true);
        setError(null);
        try {
          await loginWithGoogle(response.credential);
          onClose();
        } catch {
          setError("Google sign-in didn't go through — try again.");
        } finally {
          setBusy(false);
        }
      },
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 280,
      });
    }
  }, [open, loginWithGoogle, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await loginWithPassword(username, password);
      } else {
        await registerWithPassword(username, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(parseAuthError(err, mode));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -0.6 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 150, damping: 17 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-sm bg-card p-6 paper-shadow-lg"
          >
            <WashiTape rotation={-14} width="3.4rem" height="1rem" className="-top-2.5 left-8" />
            <WashiTape color="var(--sage)" rotation={12} width="3.4rem" height="1rem" className="-top-2.5 right-8" />
            <DoodleStar className="absolute -right-3 -top-3 h-6 w-6 text-[var(--terracotta)]" />

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-[var(--terracotta)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 text-center">
              <p className="font-hand text-xl text-[var(--sage)]">
                {mode === "login" ? "welcome back" : "let's pin you up"}
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold">
                {mode === "login" ? "Sign in" : "Create an account"}
              </h2>
            </div>

            {GOOGLE_CLIENT_ID && <div className="mb-4 flex justify-center" ref={googleBtnRef} />}

            <form onSubmit={submit} className="space-y-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full rounded-sm border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-[var(--terracotta)]"
              />
              {mode === "register" && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full rounded-sm border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-[var(--terracotta)]"
                />
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-sm border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-[var(--terracotta)]"
              />

              {error && <p className="text-sm text-[var(--terracotta)]">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="font-sans w-full rounded-sm bg-[var(--terracotta)] py-2.5 text-sm font-bold text-primary-foreground shadow-[2px_3px_0_var(--sienna)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? "one sec…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-hand mt-4 w-full text-center text-lg text-[var(--terracotta)] underline decoration-wavy decoration-1 underline-offset-4"
            >
              {mode === "login" ? "new here? make an account" : "already have one? sign in"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
