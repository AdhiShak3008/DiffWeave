import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext();

const TOKEN_KEY = "diffweave_token";
const USER_KEY = "diffweave_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY) || localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Validate token with DocWeave auth engine on mount
  useEffect(() => {
    if (token && !user) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && !data.detail) {
            setUser(data);
            localStorage.setItem(USER_KEY, JSON.stringify(data));
          } else {
            // Invalid token - clear
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {});
    }
  }, [token]); // eslint-disable-line

  const login = useCallback((accessToken, userData = null) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const logout = useCallback(() => {
    // Notify server to clear CLI credentials
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        setUser,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
