"use client";
import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "./SessionProvider";

const SocketContext = React.createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { socketToken } = useSession();
  const [socket, setSocket] = React.useState<Socket | null>(null);

  // Only rebuild the socket when we go from "no token" to "have a token".
  // The token itself is re-minted on every /api/auth/me call, so keying the
  // effect on its value would tear down a healthy connection on each refresh.
  const hasToken = !!socketToken;
  const tokenRef = React.useRef<string | null>(socketToken);
  tokenRef.current = socketToken;

  React.useEffect(() => {
    if (!hasToken) return;
    const url = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001";

    const s = io(url, {
      auth: (cb) => cb({ token: tokenRef.current }),
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
    });

    // The handshake token is short-lived. If the server rejects us after it
    // expires, mint a fresh one and retry rather than looping on a dead token.
    const onConnectError = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.socketToken) tokenRef.current = data.socketToken;
      } catch {
        // offline — socket.io will keep retrying on its own
      }
    };
    s.on("connect_error", onConnectError);

    setSocket(s);
    return () => {
      s.off("connect_error", onConnectError);
      s.disconnect();
    };
  }, [hasToken]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return React.useContext(SocketContext);
}
