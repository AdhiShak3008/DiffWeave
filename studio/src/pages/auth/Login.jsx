import { API_BASE } from "../../api/client.js";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/AuthLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.message || null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        setError(data.detail || "Invalid email or password.");
        return;
      }
      const user = data.user || { email, username: email.split("@")[0] };
      localStorage.setItem("diffweave_token", data.access_token);
      localStorage.setItem("diffweave_user", JSON.stringify(user));
      login(data.access_token, user);
      navigate("/", { replace: true });
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        setError(data.detail || "Could not start demo session.");
        return;
      }
      const user = data.user || { email: "evaluator@docweave.io", username: "DocWeave Evaluator", role: "evaluator" };
      localStorage.setItem("diffweave_token", data.access_token);
      localStorage.setItem("diffweave_user", JSON.stringify(user));
      login(data.access_token, user);
      navigate("/", { replace: true });
    } catch {
      setError("Couldn't reach the server for demo login.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Document intelligence"
      title="Welcome back"
      subtitle="Sign in with your DocWeave account to continue."
    >
      <form onSubmit={handleSubmit} className="dw-auth-form">
        {success && <div className="dw-auth-form__success">{success}</div>}

        <div className="dw-field">
          <label className="dw-label">Email</label>
          <input className="dw-input" type="email" autoComplete="email" placeholder="you@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          {email && !isValidEmail(email) && <span className="dw-field__error">Enter a valid email</span>}
        </div>

        <div className="dw-field">
          <label className="dw-label">Password</label>
          <input className="dw-input" type={showPassword ? "text" : "password"} autoComplete="current-password"
            placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label className="dw-auth-form__show-password">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show password
          </label>
        </div>

        <div className="dw-auth-form__options">
          <span />
          <Link to="/forgot-password" className="dw-auth-form__link">Forgot password?</Link>
        </div>

        {error && <div className="dw-auth-form__error">{error}</div>}

        <button type="submit" className="dw-btn dw-btn--primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="dw-auth-form__footer-text">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>

        <div className="dw-auth-divider"><span>or explore directly</span></div>

        <button type="button" className="dw-auth-demo-btn" onClick={handleDemoLogin} disabled={demoLoading || loading}>
          {demoLoading ? "Starting demo workspace…" : "⚡ Quick Demo Access (No account needed)"}
        </button>
      </form>
    </AuthLayout>
  );
}