/**
 * BullMQ queue + job name contract shared between the Next.js app
 * (producer) and the worker process (consumer).
 */

export const QUEUE_NAMES = {
  EMAIL: "email",
  AUDIT: "audit",
  DIGEST: "digest",
} as const;

export type EmailJobName = "welcome" | "mention" | "comment" | "assigned" | "invitation" | "task-due-soon";

export interface EmailJobData {
  name: EmailJobName;
  to: string;
  data: Record<string, unknown>;
}

export interface AuditJobData {
  orgId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DigestJobData {
  userId: string;
}
