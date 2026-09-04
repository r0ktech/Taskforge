import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { REDIS_EVENTS_CHANNEL, type RealtimeEvent } from "@taskforge/shared";

const PORT = Number(process.env.REALTIME_PORT ?? 4001);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const httpServer = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "taskforge-realtime" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// WebSocket transport isn't subject to CORS, but the polling fallback is —
// so an origin mismatch here shows up as "realtime works until it degrades".
// In dev any localhost port is allowed (Next picks 3001+ when 3000 is taken);
// in production only APP_URL is.
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.APP_URL ?? "http://localhost:3000"
    : /^http:\/\/localhost:\d+$/;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

// Authenticate each socket connection with the same JWT the web app issues
// as a session cookie (passed explicitly during the socket handshake).
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  socket.join(`user:${userId}`);

  socket.on("room:join", (room: string) => {
    // Rooms are scoped like "board:<id>" / "project:<id>"; the web app only
    // asks a client to join a room after it has already authorized that
    // user's access to the underlying resource server-side.
    if (typeof room === "string" && room.length < 200) {
      socket.join(room);
    }
  });

  socket.on("room:leave", (room: string) => {
    if (typeof room === "string") socket.leave(room);
  });

  socket.on("presence:ping", (room: string) => {
    socket.to(room).emit("presence:update", { userId, at: Date.now() });
  });

  socket.on("disconnect", () => {
    // no-op — presence is naturally derived from room membership
  });
});

// Subscribe to the shared Redis pub/sub channel that the Next.js app and the
// worker publish domain events to, and fan them out to the matching room.
const subscriber = new Redis(REDIS_URL);
subscriber.subscribe(REDIS_EVENTS_CHANNEL, (err) => {
  if (err) {
    console.error("[realtime] failed to subscribe to redis channel", err);
    process.exit(1);
  }
  console.log(`[realtime] subscribed to ${REDIS_EVENTS_CHANNEL}`);
});

subscriber.on("message", (_channel, message) => {
  try {
    const event = JSON.parse(message) as RealtimeEvent;
    io.to(event.room).emit(event.type, event.payload);
  } catch (err) {
    console.error("[realtime] failed to process event", err);
  }
});

httpServer.listen(PORT, () => {
  console.log(`[realtime] Task Forge realtime server listening on :${PORT}`);
});
