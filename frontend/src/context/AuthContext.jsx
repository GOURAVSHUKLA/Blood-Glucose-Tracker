import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  storeAuthSession,
} from "../services/authSession.js";

const AuthContext = createContext(null);

function getInitialUser() {
  return getAuthToken() ? getStoredUser() : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  const login = useCallback((token, nextUser) => {
    storeAuthSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
