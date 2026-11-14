import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Maximize2, Compass, Sparkles, CheckCircle2 } from "lucide-react";
import { login, register, googleSignIn, requestPasswordReset, confirmPasswordReset, apiError } from "../lib/api";

declare global {
  interface Window {
    google?: any;
  }
}
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Auth() {
  const [location, navigate] = useLocation();
  const [isConfirmRoute, confirmParams] = useRoute("/reset-password/:uid/:token");
  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  const [mode, setMode] = useState(
    isConfirmRoute
      ? "confirm"
      : requestedMode === "register" || requestedMode === "forgot"
        ? requestedMode
        : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "" });
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isReset = mode === "forgot";
  const isConfirm = mode === "confirm";
  const isRegister = mode === "register";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || isReset || isConfirm) return;
    const tryRender = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setLoading(true);
          setIsError(false);
          setMessage("");
          try {
            await googleSignIn(response.credential);
            navigate("/dashboard");
          } catch {
            setIsError(true);
            setMessage("Google sign-in didn't go through — please try again.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        shape: "pill",
      });
    };
    if (window.google) tryRender();
    else {
      const id = setInterval(() => {
        if (window.google) {
          tryRender();
          clearInterval(id);
        }
      }, 200);
      return () => clearInterval(id);
    }
  }, [mode, isReset, isConfirm, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsError(false);
    setMessage("");
    try {
      if (isConfirm) {
        const data = new FormData(e.target as HTMLFormElement);
        const new_password = String(data.get("new_password") || "");
        await confirmPasswordReset(confirmParams!.uid, confirmParams!.token, new_password);
        setMessage("Password updated successfully. You can sign in now.");
        setTimeout(() => switchMode("login"), 1200);
      } else if (isReset) {
        await requestPasswordReset(form.email);
        setMessage("If an account exists for that email, we've dispatched a reset link.");
      } else if (isRegister) {
        await register({
          username: form.username,
          email: form.email,
          password: form.password,
          first_name: form.first_name,
        });
        navigate("/dashboard");
      } else {
        await login(form.username, form.password);
        navigate("/dashboard");
      }
    } catch (err) {
      setIsError(true);
      setMessage(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: string) => {
    setMode(next);
    setMessage("");
    setIsError(false);
    navigate(`/auth?mode=${next}`);
  };

  return (
    <main className="auth-page editorial-auth">
      {/* Left Column: Visual Art Direction inspired by Inspo 1 & 2 */}
      <div className="auth-art-column">
        <div className="arch-grid-crosshair top-left" aria-hidden="true">+</div>
        <div className="arch-grid-crosshair top-right" aria-hidden="true">+</div>
        <div className="arch-grid-crosshair bottom-left" aria-hidden="true">+</div>
        <div className="arch-grid-crosshair bottom-right" aria-hidden="true">+</div>

        <img
          src="/images/bedroom.jpg"
          alt="Serene architectural bedroom sanctuary"
          className="auth-art-bg"
        />

        <div className="auth-art-vignette" />

        <div className="auth-art-header">
          <span className="arch-badge-olive">
            WE DESIGN THE FEELING OF YOU
          </span>
        </div>

        <div className="auth-art-copy">
          <span className="eyebrow section-label text-[#EFECE5]">House Muse / Atelier</span>
          <h1 className="headline-serif text-[#FAF7F2] text-4xl lg:text-5xl leading-tight">
            Designed Around Real Living.
          </h1>
          <p className="text-[#E8E2D5] text-sm leading-relaxed max-w-sm">
            Quiet luxury, everyday. A spatial intelligence that transforms dimensions and budgets into rooms you love returning to.
          </p>

          <div className="auth-art-metrics">
            <div>
              <b>09</b>
              <span>Design Languages</span>
            </div>
            <div className="divider-h" />
            <div>
              <b>100%</b>
              <span>Proportion Accurate</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="floating-expand-btn"
          aria-label="Expand sanctuary view"
          onClick={() => window.open("/images/bedroom.jpg", "_blank")}
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Right Column: Clean Travertine Form Panel */}
      <section className="auth-panel-column">
        <div className="auth-panel-nav">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Return to House Muse
          </Link>
        </div>

        <div className="auth-form-card">
          <div className="auth-form-header">
            <div className="auth-glyph-ring">
              <LockKeyhole size={18} />
            </div>
            <span className="eyebrow section-label">
              {isConfirm
                ? "Coordinates / New Key"
                : isReset
                ? "Coordinates / Access Recovery"
                : isRegister
                ? "Coordinates / Welcome"
                : "Coordinates / Return"}
            </span>
            <h2 className="headline-serif text-espresso text-3xl">
              {isConfirm
                ? "Choose a new password."
                : isReset
                ? "Find your way back in."
                : isRegister
                ? "Shape your personal sanctuary."
                : "Good to see you again."}
            </h2>
            <p className="auth-desc">
              {isConfirm
                ? "Enter a secure key of at least 8 characters to resume your portfolio."
                : isReset
                ? "Enter your account email and we'll dispatch an architectural access link."
                : isRegister
                ? "Save your measured rooms, custom style languages, and allocated budgets."
                : "Your measured spaces and design directions are preserved and waiting."}
            </p>
          </div>

          {message && (
            <div className={isError ? "notice notice-error" : "notice"}>
              {message}
            </div>
          )}

          <form onSubmit={submit} className="auth-form-fields">
            {isConfirm ? (
              <label className="field-label">
                <span>New Password</span>
                <div className="password-wrap">
                  <input
                    name="new_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            ) : (
              <>
                {isRegister && (
                  <label className="field-label">
                    <span>Full Name</span>
                    <input
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      placeholder="e.g. Alisha Mehta"
                    />
                  </label>
                )}

                {!isReset && (
                  <label className="field-label">
                    <span>Username</span>
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="e.g. alisha_studio"
                      required
                    />
                  </label>
                )}

                {(isReset || isRegister) && (
                  <label className="field-label">
                    <span>Email Address</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                )}

                {!isReset && (
                  <label className="field-label">
                    <span>Password</span>
                    <div className="password-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                )}
              </>
            )}

            <button className="button primary full-width" type="submit" disabled={loading}>
              {loading
                ? "Connecting to Atelier…"
                : isConfirm
                ? "Set New Password"
                : isReset
                ? "Send Reset Link"
                : isRegister
                ? "Create Spatial Account"
                : "Sign In"}
            </button>
          </form>

          {!isReset && !isConfirm && GOOGLE_CLIENT_ID && (
            <>
              <div className="or-divider">
                <span>or continue with Google</span>
              </div>
              <div ref={googleBtnRef} className="google-btn-wrapper" />
            </>
          )}

          {!isRegister && !isReset && !isConfirm && (
            <button className="quiet-link" onClick={() => switchMode("forgot")}>
              Forgot your key?
            </button>
          )}

          {!isConfirm && (
            <div className="auth-toggle-footer">
              {isRegister ? (
                <span>
                  Already hold a House Muse archive?{" "}
                  <button type="button" onClick={() => switchMode("login")}>
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  New to House Muse?{" "}
                  <button type="button" onClick={() => switchMode("register")}>
                    Create an account
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
