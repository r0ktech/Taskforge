/**
 * Realtime event contract shared between the Next.js app (publisher),
 * the realtime Socket.IO server (subscriber -> broadcaster), and the
 * background worker (publisher for async-completed work).
 *
 * Events are published to a single Redis pub/sub channel, `taskforge:events`,
 * as JSON envelopes. The realtime server re-broadcasts each event to the
 * Socket.IO room matching its `room` field.
 */

export type RealtimeEvent =
  | { type: "task.created"; room: string; payload: { taskId: string; columnId: string; boardId: string } }
  | { type: "task.updated"; room: string; payload: { taskId: string; fields: Record<string, unknown> } }
  | { type: "task.moved"; room: string; payload: { taskId: string; fromColumnId: string; toColumnId: string; order: number } }
  | { type: "task.deleted"; room: string; payload: { taskId: string; columnId: string } }
  | { type: "comment.created"; room: string; payload: { taskId: string; commentId: string; authorId: string } }
  | { type: "column.created"; room: string; payload: { boardId: string; columnId: string } }
  | { type: "column.updated"; room: string; payload: { boardId: string; columnId: string } }
  | { type: "notification.created"; room: string; payload: { notificationId: string; recipientId: string } }
  | { type: "presence.ping"; room: string; payload: { userId: string } };

export const REDIS_EVENTS_CHANNEL = "taskforge:events";

/** Room helpers keep the naming convention in one place. */
export const rooms = {
  board: (boardId: string) => `board:${boardId}`,
  project: (projectId: string) => `project:${projectId}`,
  user: (userId: string) => `user:${userId}`,
};
