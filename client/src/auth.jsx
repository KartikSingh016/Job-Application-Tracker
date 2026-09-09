import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth as authApi, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until we've checked whether a stored token is still valid
  const [status, setStatus] = useState(getToken() ? "loading" : "signed-out");

  // revalidate a stored token on boot — it may have expired while the tab was closed
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("signed-in");
      })
      .catch(() => {
        if (!cancelled) setStatus("signed-out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // any 401 from anywhere in the app drops us back to the login screen
  useEffect(() => {
    function onExpired() {
      setUser(null);
      setStatus("signed-out");
    }
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const signIn = useCallback(async (googleCredential) => {
    const { token, user: me } = await authApi.google(googleCredential);
    setToken(token);
    setUser(me);
    setStatus("signed-in");
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus("signed-out");
    // stops Google from silently re-authenticating on the next visit
    window.google?.accounts?.id?.disableAutoSelect?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
