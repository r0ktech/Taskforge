import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// BullMQ requires maxRetriesPerRequest: null on the connection it manages.
export const bullConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Separate plain connection for publishing domain events consumed by the
// realtime server (kept distinct from the BullMQ blocking connection).
export const publisher = new Redis(REDIS_URL);
