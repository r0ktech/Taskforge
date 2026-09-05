# Deploying Task Forge

Task Forge is **three deployable units** plus two backing services. They can all
live on one host, but the web app alone is not a working deployment.

| Unit | What it is | Start command |
|---|---|---|
| `apps/web` | Next.js app + REST API | `npm run start` (after `npm run build`) |
| `apps/realtime` | Long-lived Socket.IO server | `npm run start:realtime` |
| `apps/worker` | BullMQ consumer (email, audit, digests) | `npm run start:worker` |

Backing services: **PostgreSQL** and **Redis**. Both are required — the app
will not boot without them.

> **Serverless caveat:** `apps/realtime` and `apps/worker` are long-running
> processes. They cannot run on Vercel/Netlify functions. Put them on a
> container/VM host (Railway, Render, Fly.io, ECS, a VPS). The Next.js app is
> happy on any of those *or* on Vercel.

## Build and release

From the repository root:

```bash
npm ci                 # runs `prisma generate` automatically via postinstall
npm run build:all      # builds packages -> web + realtime + worker
npm run db:deploy      # applies prisma/migrations to the database
npm run start          # or start:realtime / start:worker
```

`npm run build` builds only the packages and the web app. Use `build:all` when
one host runs all three, or the per-service scripts (`build:web`,
`build:realtime`, `build:worker`) when they deploy separately.

**Build order matters.** `packages/shared` and `packages/database` compile to
`dist/` and everything else imports the compiled output, so the root scripts
always build packages first. Running `npm run build --workspace=apps/worker`
on its own, before the packages are built, will fail.

## Database

The schema is managed by Prisma migrations in
`packages/database/prisma/migrations`.

- **First deploy:** `npm run db:deploy` creates every table from scratch.
- **Existing database created with `db push`:** baseline it once with
  `npx prisma migrate resolve --applied 0_init` (run inside
  `packages/database`), then use `db:deploy` from then on.
- **Demo data (optional):** `npm run db:seed` — creates the Task Forge Labs
  org and logs in as `ava@taskforge.dev` / `password123`. Never run this
  against a real production database.

Do **not** use `db push` in production; it has no migration history and can
drop columns without warning.

## Environment variables

Copy `.env.example` and fill it in. Every service reads the same file/vars.
The ones that actually break things if wrong:

| Variable | Why it matters |
|---|---|
| `DATABASE_URL` | Required at build time (migrations) and runtime. Managed Postgres usually needs `?sslmode=require`. |
| `REDIS_URL` | Required by all three units. Managed Redis is often `rediss://` (TLS). |
| `JWT_SECRET` | **Must** be set to a long random value in production, and must be *identical* across web + realtime, or WebSocket auth fails. `openssl rand -base64 48` |
| `APP_URL` | Public URL of the web app. Used for email links and, in production, as the realtime server's CORS allow-list. No trailing slash. |
| `NEXT_PUBLIC_REALTIME_URL` | Public URL of the realtime service. Baked into the client bundle **at build time**, so it must be set before `npm run build`, not just at runtime. |
| `SMTP_*` | Without a real SMTP host, email jobs retry and fail. The app still works; notifications just stay in-app. |

## Known limitations to plan around

- **File attachments are written to local disk** (`apps/web/public/uploads`).
  On an ephemeral filesystem they vanish on redeploy, and on a read-only one
  uploads fail outright. For real use, mount a persistent volume or replace
  the handler in `apps/web/src/app/api/tasks/[taskId]/attachments/route.ts`
  with S3/R2. Everything else in the app is stateless.
- **Sticky sessions / scaling realtime:** a single realtime instance is fine.
  To run more than one, add the Socket.IO Redis adapter so broadcasts reach
  clients on every instance — the events themselves already travel through
  Redis pub/sub, but Socket.IO room membership is per-instance.
- `NEXT_PUBLIC_REALTIME_URL` must be reachable **from the browser**, not just
  from inside your private network.
