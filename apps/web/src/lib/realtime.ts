import { REDIS_EVENTS_CHANNEL, type RealtimeEvent } from "@taskforge/shared";
import { redisPublisher } from "./redis";

/** Publishes a domain event; the standalone realtime server fans it out over Socket.IO. */
export async function publishEvent(event: RealtimeEvent): Promise<void> {
  try {
    await redisPublisher.publish(REDIS_EVENTS_CHANNEL, JSON.stringify(event));
  } catch (err) {
    // Realtime is a nice-to-have; never let a Redis hiccup fail the request.
    console.error("[realtime] publish failed", err);
  }
}
