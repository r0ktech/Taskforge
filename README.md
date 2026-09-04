# Task Forge

A project management / team collaboration platform — organizations, workspaces,
teams, projects, and real-time Kanban boards, with comments, mentions, file
uploads, notifications, role-based permissions, audit logs, and analytics.

Built as a small monorepo so the "impressive" infrastructure pieces are real,
separate services rather than simulated in one process:

```
task-forge/
├── apps/
│   ├── web/         Next.js 14 (App Router) — UI + REST API + Postgres via Prisma
│   ├── realtime/     Standalone Socket.IO server, fed by Redis pub/sub
│   └── worker/       BullMQ worker — email, audit log writes, due-date digests
├── packages/
│   ├── database/     Prisma schema + client, shared by web and worker
│   └── shared/       Zod schemas, RBAC rules, realtime/queue event contracts
└── docker-compose.yml  Postgres + Redis + MailHog for local dev
```

## Architecture at a glance

- **Auth** — email/password, bcrypt hashing, JWT in an http-only cookie, backed
  by a revocable `Session` row in Postgres.
- **RBAC** — one `Role` enum (`OWNER > ADMIN > MEMBER > VIEWER`) applied at
  every scope (org, workspace, team, project); a user's effective role is the
  highest grant from that resource or any ancestor. See
  `packages/shared/src/permissions.ts`.
- **Real-time** — API routes publish domain events (`task.moved`,
  `comment.created`, `notification.created`, ...) to a single Redis pub/sub
  channel. The standalone `realtime` service subscribes and re-broadcasts to
  Socket.IO rooms (`board:<id>`, `user:<id>`); browser clients only ever talk
  to that service, not to Redis directly.
- **Background workers** — task creation, mentions, and comments enqueue
  BullMQ jobs (`email`, `audit`, `digest`) instead of doing that work inline.
  The `worker` app sends real email via SMTP (nodemailer), writes audit log
  rows, and runs a repeatable "due-soon" scan that emails people about
  upcoming due dates — effectively an in-process cron, no separate scheduler.
- **Kanban ordering** — cards use fractional indexing (`packages/web` ->
  `lib/order.ts`) so a drag-and-drop reorder is a single-row update, not a
  rewrite of every sibling.
- **File uploads** — stored on local disk under `apps/web/public/uploads`,
  served by Next's static file handling. Swap `lib/api-helpers` upload logic
  for S3 in production.

## Prerequisites

- Node.js 20+
- Postgres 16 and Redis 7 — either via `docker compose up -d`, or local
  installs (Homebrew: `brew install postgresql@16 redis`)

## Setup

```bash
npm install

# copy env files (defaults already point at the docker-compose stack)
cp .env.example .env
cp .env apps/web/.env
cp .env apps/realtime/.env
cp .env apps/worker/.env
cp .env packages/database/.env

# start infra
docker compose up -d          # Postgres, Redis, MailHog
# — or, without Docker, point DATABASE_URL / REDIS_URL at local installs —

# schema + demo data
npm run db:push
npm run db:seed
```

Seeded login: **ava@taskforge.dev / password123** (owner of "Task Forge Labs",
with a populated "Engineering Roadmap" board, teammates, comments, and audit
history).

## Running it

Three processes, three terminals:

```bash
npm run dev            # apps/web        -> http://localhost:3000
npm run dev:realtime   # apps/realtime   -> http://localhost:4001
npm run dev:worker     # apps/worker     -> processes queued jobs
```

With `docker compose up -d` also running, MailHog's web UI at
`http://localhost:8025` shows every email the worker sends (mentions,
assignments, invitations, due-date reminders) without needing a real inbox.

## What's implemented vs. stubbed

Implemented end-to-end and tested against a live Postgres/Redis: signup with
auto-created org, RBAC-gated CRUD for orgs/workspaces/teams/projects,
drag-and-drop Kanban with WIP limits, task comments with @mention parsing,
in-app + email notifications, file attachments, org invitations with
email + accept flow, a filterable audit log, per-project analytics
(throughput, priority mix, workload), and global search.

**Responsive.** The app is built mobile-first and verified at 360px, 390px
(iPhone), 768px and 1024px (iPad portrait/landscape), and desktop:

- The sidebar becomes an off-canvas drawer below `lg`, opened by a hamburger
  in the header, dismissed by the scrim, a close button, Escape, or navigating.
- The board scrolls horizontally with columns at `82vw` (capped at 300px), so
  the next column peeks in as a swipe affordance; the task panel goes
  full-screen; dialogs, the notification popover, and the command palette all
  keep a viewport gutter.
- **Touch drag is a long-press**, not a swipe. Kanban drag uses a `MouseSensor`
  (4px) plus a `TouchSensor` with a 200ms delay, so an ordinary swipe scrolls
  the board and only a press-and-hold picks up a card. Both paths, plus
  "a quick swipe must not move a card", are covered by the checks below.
- No page scrolls horizontally and no element overflows the viewport at any
  tested width (asserted programmatically, not by eye).

Verified in a real headless Chromium, not just at the API layer:

- **Drag-and-drop** — a card dragged between columns persists across a reload,
  with mouse on desktop and with a long-press on a simulated touch device;
  a quick swipe scrolls the board instead of moving a card.
- **Realtime** — two browsers, two different signed-in users, same board. One
  user drags a card; the other's board reflects the move with no reload,
  ~100ms after the drop (measured by polling the second browser's DOM).
- **Background email** — a comment containing an @mention causes the worker to
  deliver an SMTP message with the right subject and recipient.
- **Auth guards** — unauthenticated page requests 307 to `/login`; API routes
  return 401.

Two realtime bugs were found and fixed this way, both of which only appear
after the socket's first reconnect (so they're invisible to a
single-page-load test): the session provider re-minted its JWT on every
`/api/auth/me` call, which tore down and rebuilt a healthy socket; and the
client re-joined its Socket.IO rooms only when the socket *object* changed,
so a transparent reconnect left it subscribed to nothing. See
`apps/web/src/hooks/useSocketRoom.ts` and `providers/SocketProvider.tsx`.

Left as reasonable follow-ups rather than built out: password reset,
per-workspace/team custom role overrides beyond the four built-in roles,
S3-backed uploads, and a production email provider (SMTP config is already
externalized in `.env` — swap host/port/credentials for Postgres/SES/etc.).
