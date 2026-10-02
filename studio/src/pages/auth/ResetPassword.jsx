import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/AuthLayout.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token) { setError("This reset link is missing or invalid."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Could not reset password."); return; }
      navigate("/login", { replace: true, state: { message: "Password reset successfully. You can now sign in." } });
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Choose a new password for your DocWeave account."
      footer={<span>Remembered it? <Link to="/login">Back to login</Link></span>}
    >
      <form onSubmit={handleSubmit} className="dw-auth-form">
        <div className="dw-field">
          <label className="dw-label">New password</label>
          <input className="dw-input" type="password" autoComplete="new-password" placeholder="••••••••"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>
        <div className="dw-field">
          <label className="dw-label">Confirm new password</label>
          <input className="dw-input" type="password" autoComplete="new-password" placeholder="••••••••"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        {error && <div className="dw-auth-form__error">{error}</div>}
        <button type="submit" className="dw-btn dw-btn--primary" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}