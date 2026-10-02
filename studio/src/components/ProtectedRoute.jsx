import { useAuth } from "../context/AuthContext.jsx";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();

  // Check both React state and localStorage to prevent transition flashes
  const hasToken = isAuthenticated || Boolean(token) || Boolean(localStorage.getItem("diffweave_token"));

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
