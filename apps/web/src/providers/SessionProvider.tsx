"use client";
import * as React from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarColor?: string | null;
  avatarUrl?: string | null;
}

interface SessionContextValue {
  user: SessionUser | null;
  socketToken: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [socketToken, setSocketToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
      setSocketToken(data.socketToken ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setSocketToken(null);
    window.location.href = "/login";
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, socketToken, loading, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
