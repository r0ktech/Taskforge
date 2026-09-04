import { Queue } from "bullmq";
import Redis from "ioredis";
import { QUEUE_NAMES, type EmailJobData, type AuditJobData, type DigestJobData } from "@taskforge/shared";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

declare global {
  // eslint-disable-next-line no-var
  var __taskforge_queue_conn__: Redis | undefined;
  // eslint-disable-next-line no-var
  var __taskforge_queues__:
    | { email: Queue<EmailJobData>; audit: Queue<AuditJobData>; digest: Queue<DigestJobData> }
    | undefined;
}

const connection =
  global.__taskforge_queue_conn__ ?? new Redis(REDIS_URL, { maxRetriesPerRequest: null });
if (process.env.NODE_ENV !== "production") global.__taskforge_queue_conn__ = connection;

export const queues =
  global.__taskforge_queues__ ??
  {
    email: new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, { connection }),
    audit: new Queue<AuditJobData>(QUEUE_NAMES.AUDIT, { connection }),
    digest: new Queue<DigestJobData>(QUEUE_NAMES.DIGEST, { connection }),
  };
if (process.env.NODE_ENV !== "production") global.__taskforge_queues__ = queues;

const defaultJobOpts = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: 500,
  removeOnFail: 1000,
};

export async function enqueueEmail(job: EmailJobData) {
  try {
    await queues.email.add(job.name, job, defaultJobOpts);
  } catch (err) {
    console.error("[queue:email] enqueue failed", err);
  }
}

export async function recordAudit(job: AuditJobData) {
  try {
    await queues.audit.add("record", job, defaultJobOpts);
  } catch (err) {
    // Fall back to a synchronous write so we never silently lose an audit
    // trail entry just because Redis is briefly unavailable.
    console.error("[queue:audit] enqueue failed, writing synchronously", err);
    const { prisma } = await import("./db");
    await prisma.auditLog
      .create({
        data: {
          orgId: job.orgId,
          actorId: job.actorId,
          action: job.action,
          entityType: job.entityType,
          entityId: job.entityId ?? null,
          metadata: job.metadata ? JSON.parse(JSON.stringify(job.metadata)) : undefined,
        },
      })
      .catch(() => {});
  }
}
