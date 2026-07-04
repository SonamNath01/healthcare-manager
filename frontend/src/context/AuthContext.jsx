import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../lib/apiClient";

const AuthContext = createContext(null);

const TOKEN_KEY = "hm_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [authCheckFailed, setAuthCheckFailed] = useState(false);

  const verify = useCallback((currentToken) => {
    if (!currentToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api
      .get("/auth/me", { token: currentToken })
      .then((data) => {
        setUser(data.user);
        setAuthCheckFailed(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        } else {
          setAuthCheckFailed(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    verify(token);
    
  }, [token]);

  const retryAuthCheck = useCallback(() => verify(token), [verify, token]);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.post("/auth/register", { name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, authCheckFailed, retryAuthCheck, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
