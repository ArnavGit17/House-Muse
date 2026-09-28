import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
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
  const params = new URLSearchParams(location.split("?")[1] || "");
  const [mode, setMode] = useState(isConfirmRoute ? "confirm" : params.get("mode") || "login");
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
          setLoading(true); setIsError(false); setMessage("");
          try { await googleSignIn(response.credential); navigate("/dashboard"); }
          catch { setIsError(true); setMessage("Google sign-in didn't go through — try again."); }
          finally { setLoading(false); }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, { theme: "outline", size: "large", width: 320 });
    };
    if (window.google) tryRender();
    else { const id = setInterval(() => { if (window.google) { tryRender(); clearInterval(id); } }, 200); return () => clearInterval(id); }
  }, [mode, isReset, isConfirm, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setIsError(false); setMessage("");
    try {
      if (isConfirm) {
        const data = new FormData(e.target as HTMLFormElement);
        const new_password = String(data.get("new_password") || "");
        await confirmPasswordReset(confirmParams!.uid, confirmParams!.token, new_password);
        setMessage("Password updated. You can sign in now.");
        setTimeout(() => switchMode("login"), 1200);
      } else if (isReset) {
        await requestPasswordReset(form.email);
        setMessage("If an account exists for that email, we'll send a reset link shortly.");
      } else if (isRegister) {
        await register({ username: form.username, email: form.email, password: form.password, first_name: form.first_name });
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

  const switchMode = (next: string) => { setMode(next); setMessage(""); setIsError(false); navigate(`/auth?mode=${next}`); };

  return <main className="auth-page"><div className="auth-art"><div className="auth-art-copy"><span className="eyebrow">House Muse</span><h1>Make space for better ideas.</h1><p>A considered starting point for rooms that feel like yours.</p></div><img src="/manus-storage/house-muse-editorial-room_559afaf4.jpg" alt="Warm contemporary living room" /></div><section className="auth-panel"><Link href="/" className="back-link"><ArrowLeft size={15} /> House Muse</Link><div className="auth-form-wrap"><div className="auth-symbol"><LockKeyhole size={18} /></div><span className="eyebrow">{isConfirm ? "Account / New password" : isReset ? "Account / Reset" : isRegister ? "Account / Create" : "Account / Sign in"}</span><h2>{isConfirm ? "Choose a new password." : isReset ? "Find your way back in." : isRegister ? "Make an account of it." : "Good to see you again."}</h2><p>{isConfirm ? "Enter a new password for your account." : isReset ? "Enter your email and we'll send a secure reset link." : isRegister ? "Save your rooms, briefs, and directions as you go." : "Your saved rooms are ready when you are."}</p>{message && <div className={isError ? "notice notice-error" : "notice"}>{message}</div>}<form onSubmit={submit}>{isConfirm ? <label className="field-label">New password<div className="password-wrap"><input name="new_password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" minLength={8} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label> : <>{isRegister && <label className="field-label">Name<input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Your name" /></label>}{!isReset && <label className="field-label">Username<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Your username" required /></label>}{(isReset || isRegister) && <label className="field-label">Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></label>}{!isReset && <label className="field-label">Password<div className="password-wrap"><input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" minLength={8} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}</>}<button className="button primary full" type="submit" disabled={loading}>{loading ? "Please wait…" : isConfirm ? "Set new password" : isReset ? "Send reset link" : isRegister ? "Create account" : "Sign in"}</button></form>{!isReset && !isConfirm && GOOGLE_CLIENT_ID && <><div className="or"><span>or</span></div><div ref={googleBtnRef} /></>}{!isRegister && !isReset && !isConfirm && <button className="quiet-link" onClick={() => switchMode("forgot")}>Forgot password?</button>}{!isConfirm && <div className="auth-switch">{isRegister ? <>Already have an account? <button onClick={() => switchMode("login")}>Sign in</button></> : <>New to House Muse? <button onClick={() => switchMode("register")}>Create an account</button></>}</div>}</div></section></main>;
}
