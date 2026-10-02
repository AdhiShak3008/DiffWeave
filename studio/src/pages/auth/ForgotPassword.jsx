import { API_BASE } from "../../api/client.js";
﻿import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/AuthLayout.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Could not send reset email."); return; }
      setSent(true);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a secure reset link."
      footer={<span>Remembered it? <Link to="/login">Back to login</Link></span>}
    >
      {sent ? (
        <div className="dw-auth-form">
          <div className="dw-auth-form__success">
            We sent a password reset link to <strong>{email}</strong>.<br />
            Check your inbox and spam folder.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="dw-auth-form">
          <div className="dw-field">
            <label className="dw-label">Email</label>
            <input className="dw-input" type="email" autoComplete="email" placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <div className="dw-auth-form__error">{error}</div>}
          <button type="submit" className="dw-btn dw-btn--primary" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}