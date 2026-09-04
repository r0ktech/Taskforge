import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

declare global {
  // eslint-disable-next-line no-var
  var __taskforge_redis_pub__: Redis | undefined;
}

export const redisPublisher = global.__taskforge_redis_pub__ ?? new Redis(REDIS_URL, { lazyConnect: false });
if (process.env.NODE_ENV !== "production") {
  global.__taskforge_redis_pub__ = redisPublisher;
}
