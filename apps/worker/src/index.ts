import "dotenv/config";
import { Worker, Queue } from "bullmq";
import { prisma } from "@taskforge/database";
import {
  QUEUE_NAMES,
  REDIS_EVENTS_CHANNEL,
  rooms,
  type EmailJobData,
  type AuditJobData,
  type DigestJobData,
} from "@taskforge/shared";
import { bullConnection, publisher } from "./redis";
import { transporter, MAIL_FROM } from "./mailer";
import { renderEmail } from "./templates/email";

console.log("[worker] Task Forge background worker starting...");

// ---------------------------------------------------------------------------
// Email queue — actually delivers mail (MailHog in dev) with retry/backoff.
// ---------------------------------------------------------------------------
const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { subject, html } = renderEmail(job.data);
    await transporter.sendMail({
      from: MAIL_FROM,
      to: job.data.to,
      subject,
      html,
    });
    return { sentTo: job.data.to, subject };
  },
  { connection: bullConnection, concurrency: 5 },
);

emailWorker.on("completed", (job, result) => {
  console.log(`[worker:email] sent "${result.subject}" -> ${result.sentTo}`);
});
emailWorker.on("failed", (job, err) => {
  console.error(`[worker:email] job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Audit queue — durably records who-did-what without blocking the request
// that triggered it. Publishes nothing itself; the audit trail is pull-only.
// ---------------------------------------------------------------------------
const auditWorker = new Worker<AuditJobData>(
  QUEUE_NAMES.AUDIT,
  async (job) => {
    await prisma.auditLog.create({
      data: {
        orgId: job.data.orgId,
        actorId: job.data.actorId,
        action: job.data.action,
        entityType: job.data.entityType,
        entityId: job.data.entityId ?? null,
        metadata: job.data.metadata
          ? JSON.parse(JSON.stringify(job.data.metadata))
          : undefined,
      },
    });
  },
  { connection: bullConnection, concurrency: 10 },
);

auditWorker.on("failed", (job, err) => {
  console.error(`[worker:audit] job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Digest queue — a daily rollup of unread notifications per user. Scheduled
// below via BullMQ's repeatable job scheduler (cron-like) so this process
// doubles as the app's cron runner — no separate crontab needed.
// ---------------------------------------------------------------------------
const digestWorker = new Worker<DigestJobData>(
  QUEUE_NAMES.DIGEST,
  async (job) => {
    const unread = await prisma.notification.findMany({
      where: { recipientId: job.data.userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (unread.length === 0) return { skipped: true };

    const user = await prisma.user.findUnique({
      where: { id: job.data.userId },
    });
    if (!user) return { skipped: true };

    const list = unread
      .map(
        (n) =>
          `<li style="margin-bottom:8px;"><strong>${n.title}</strong>${n.body ? ` — ${n.body}` : ""}</li>`,
      )
      .join("");

    await transporter.sendMail({
      from: MAIL_FROM,
      to: user.email,
      subject: `You have ${unread.length} unread update${unread.length === 1 ? "" : "s"} on Task Forge`,
      html: `<div style="font-family:sans-serif;"><h2>Your Task Forge digest</h2><ul>${list}</ul></div>`,
    });

    return { sentTo: user.email, count: unread.length };
  },
  { connection: bullConnection, concurrency: 5 },
);

digestWorker.on("failed", (job, err) => {
  console.error(`[worker:digest] job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Watch for tasks whose due date is approaching and enqueue reminder emails.
// Runs as a repeatable BullMQ job every 15 minutes — a lightweight in-process
// cron rather than a separate scheduler service.
// ---------------------------------------------------------------------------
const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
  connection: bullConnection,
});
const dueSoonQueue = new Queue(QUEUE_NAMES.DIGEST, {
  connection: bullConnection,
});

const dueSoonWorker = new Worker(
  "due-soon-scan",
  async () => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tasks = await prisma.task.findMany({
      where: { dueDate: { lte: soon, gte: new Date() }, archivedAt: null },
      include: { assignees: { include: { user: true } }, project: true },
    });

    for (const task of tasks) {
      for (const a of task.assignees) {
        await emailQueue.add("task-due-soon", {
          name: "task-due-soon",
          to: a.user.email,
          data: {
            taskRef: `${task.project.key}-${task.number}`,
            taskTitle: task.title,
            dueDate: task.dueDate?.toDateString() ?? "",
            link: `/projects/${task.projectId}/board?task=${task.id}`,
          },
        });
      }
    }
    return { scanned: tasks.length };
  },
  { connection: bullConnection },
);

const dueSoonScanQueue = new Queue("due-soon-scan", {
  connection: bullConnection,
});
void dueSoonScanQueue.add(
  "scan",
  {},
  {
    repeat: { every: 15 * 60 * 1000 },
    removeOnComplete: true,
    removeOnFail: true,
  },
);
void dueSoonWorker;
void dueSoonQueue;

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown() {
  console.log("[worker] shutting down...");
  await Promise.all([
    emailWorker.close(),
    auditWorker.close(),
    digestWorker.close(),
    dueSoonWorker.close(),
  ]);
  await bullConnection.quit();
  await publisher.quit();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(
  "[worker] listening on queues:",
  Object.values(QUEUE_NAMES).join(", "),
  "+ due-soon-scan",
);
void REDIS_EVENTS_CHANNEL;
void rooms;
