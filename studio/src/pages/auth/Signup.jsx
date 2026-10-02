import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/AuthLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "#ef4444", level: 1 };
  if (score === 2) return { label: "Fair", color: "#f59e0b", level: 2 };
  return { label: "Strong", color: "#10b981", level: 3 };
}

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const strength = getStrength(password);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) { setError("Name is required."); return; }
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Could not send OTP. Try again."); return; }
      setStep("otp");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (otpCode.length !== 6) { setError("Enter the 6-digit code sent to your email."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Could not verify code. Try again."); return; }
      navigate("/login", { replace: true, state: { message: "Account created! Please sign in." } });
    } catch {
      setError("Couldn't verify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok || !data.access_token) { setError(data.detail || "Could not start demo session."); return; }
      login(data.access_token, { email: data.email, username: data.username });
      navigate("/", { replace: true });
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setDemoLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout
        eyebrow="Verify your email"
        title="Enter verification code"
        subtitle={`We sent a 6-digit code to ${email}. Check your inbox (and spam folder).`}
        footer={
          <button type="button" className="dw-auth-form__link" style={{ background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setStep("form")}>
            ← Back to signup
          </button>
        }
      >
        <form onSubmit={handleVerifyOtp} className="dw-auth-form">
          <div className="dw-field">
            <label className="dw-label">Verification code</label>
            <input className="dw-input dw-input--otp" type="text" inputMode="numeric" placeholder="000000"
              maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              autoFocus required />
          </div>
          {error && <div className="dw-auth-form__error">{error}</div>}
          <button type="submit" className="dw-btn dw-btn--primary" disabled={loading}>
            {loading ? "Verifying…" : "Verify & create account"}
          </button>
          <button type="button" className="dw-auth-form__resend" onClick={handleSendOtp}>
            Resend code
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Document intelligence"
      title="Create your account"
      subtitle="Start turning documents into structured, connected knowledge."
    >
      <form onSubmit={handleSendOtp} className="dw-auth-form">
        <div className="dw-field">
          <label className="dw-label">Name</label>
          <input className="dw-input" type="text" autoComplete="name" placeholder="Ada Lovelace"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="dw-field">
          <label className="dw-label">Email</label>
          <input className="dw-input" type="email" autoComplete="email" placeholder="you@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          {email && !isValidEmail(email) && <span className="dw-field__error">Enter a valid email</span>}
        </div>
        <div className="dw-field">
          <label className="dw-label">Password</label>
          <input className="dw-input" type={showPassword ? "text" : "password"} autoComplete="new-password"
            placeholder="At least 8 characters" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          {password.length >= 8 && (
            <div className="dw-auth-form__strength">
              <div className="dw-auth-form__strength-bar">
                <div className="dw-auth-form__strength-fill" style={{ width: `${(strength.level / 3) * 100}%`, background: strength.color }} />
              </div>
              <span style={{ color: strength.color, fontSize: "11px" }}>{strength.label}</span>
            </div>
          )}
          <label className="dw-auth-form__show-password">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show password
          </label>
        </div>
        <div className="dw-field">
          <label className="dw-label">Confirm password</label>
          <input className="dw-input" type={showPassword ? "text" : "password"} autoComplete="new-password"
            placeholder="••••••••" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required />
          {confirmPassword && confirmPassword !== password && <span className="dw-field__error">Passwords don't match</span>}
        </div>
        {error && <div className="dw-auth-form__error">{error}</div>}
        <button type="submit" className="dw-btn dw-btn--primary" disabled={loading}>
          {loading ? "Sending code…" : "Continue"}
        </button>
        <div className="dw-auth-form__footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
        <div className="dw-auth-divider"><span>or explore directly</span></div>
        <button type="button" className="dw-auth-demo-btn" onClick={handleDemoLogin} disabled={demoLoading || loading}>
          {demoLoading ? "Starting demo workspace…" : "⚡ Quick Demo Access (No account needed)"}
        </button>
      </form>
    </AuthLayout>
  );
}