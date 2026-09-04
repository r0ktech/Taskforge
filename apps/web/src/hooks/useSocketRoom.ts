"use client";
import * as React from "react";
import { useSocket } from "@/providers/SocketProvider";

/**
 * Joins a Socket.IO room for the lifetime of the component and subscribes
 * to a map of event handlers. Room membership is server-trusted — the
 * client only asks to join; the API already authorized the underlying
 * resource before the client ever learned its id.
 *
 * Socket.IO reconnects transparently (network blip, server restart, ping
 * timeout) while keeping the *same* client object, but the server forgets
 * every room that socket was in. Re-joining only when the socket instance
 * changes would therefore silently stop delivering board events after the
 * first reconnect, so the join is re-sent on every `connect`.
 */
export function useSocketRoom(room: string | null, handlers: Record<string, (payload: unknown) => void>) {
  const socket = useSocket();
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!socket || !room) return;

    const join = () => socket.emit("room:join", room);

    // Join now if we're already connected, and again after every reconnect.
    if (socket.connected) join();
    socket.on("connect", join);

    const entries = Object.entries(handlersRef.current);
    const wrapped = entries.map(([event]) => {
      const fn = (payload: unknown) => handlersRef.current[event]?.(payload);
      socket.on(event, fn);
      return [event, fn] as const;
    });

    return () => {
      socket.off("connect", join);
      wrapped.forEach(([event, fn]) => socket.off(event, fn));
      if (socket.connected) socket.emit("room:leave", room);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, room]);
}
