# Scrum — What this app is and how this repo is organized

Welcome — this repository contains "Scrum", a task/kanban/timeline app used to manage tasks, assignees, tags and simple comments. It has three client targets so you can use the same product on the web, on mobile (Expo), or as a native desktop app (Electron).

If you're thinking "wtf is all this?" — here's a plain-language explanation of what each piece is and why it's here.

## TL;DR — what the app does
- Create and manage tasks with title, description, status, priority, color, tags and assignee.
- View tasks in a dashboard, board (kanban) and timeline views.
- Add comments to tasks.
- Login via Supabase-authenticated flows (frontend uses the Supabase client; the API reads the JWT to upsert the user locally).

## What "monorepo" means here
- Monorepo = one Git repository that holds multiple related projects/packages. Instead of separate repos for web, mobile and desktop, we keep all platforms together so they can share code, types, and assets.
- Benefits: easier code sharing and single source of truth for schemas/types. Tradeoff: more files and slightly more complex tooling.

## What each package is (plain language)
- `packages/web`
  - The browser application (React + Vite). This is the main UI users interact with in the browser.
  - Also contains a small server/API (Hono) under `src/api` that the web/mobile/desktop clients call for tasks/comments and user upserts.
  - DB access (Drizzle + node-postgres) is under `src/api/database`.

- `packages/mobile`
  - A mobile app built with Expo (React Native). Reuses API endpoints from `packages/web` to show the same data on phones.

- `packages/desktop`
  - An Electron wrapper that can run a packaged web UI inside a desktop application window. Useful to provide native-feeling behavior (tray, file access) or distribute a desktop build.

Why `src/web` exists inside `packages/web`:
- `packages/web` contains multiple responsibilities: the browser client, the API, and static/public assets. Putting browser-only code in `src/web` keeps things organized and makes it clear which files are client-only vs server-only.

## Key technologies — plain explanations
- Vite — fast frontend dev server and build tool for the browser app.
- React — UI library for the browser/mobile UI.
- Hono — tiny server framework used for the internal API under `packages/web/src/api`. It handles routes like `/api/tasks`.
- Drizzle ORM + `pg` (node-postgres) — server-side TypeScript ORM used to query the Postgres database.
- Supabase — provides authentication; the frontend uses Supabase client libs to sign in and get a JWT, which the API decodes to identify users.
- Expo — framework for building and running the mobile app with React Native.
- Electron — runs a Chrome-based window and Node.js runtime to package a desktop app.
- Bun — an alternative JavaScript runtime used in some scripts here (you can also use `npm`/`node` if preferred).
- Vercel — platform we use for deploying the web app and serverless API (if you choose repo-root or packages/web deployment).

## How to run it locally (quick)
Prereqs: Node (or Bun), Git. Expo CLI for mobile if you’ll use it.

1) Install deps:

```bash
bun install
# or: npm install
```

2) Start the web dev server (frontend + local API):

```bash
cd packages/web
bun run dev
```

Open http://localhost:5173 (or the port printed by Vite).

3) Mobile (optional):

```bash
cd packages/mobile
expo start
```

4) Desktop (optional):

```bash
cd packages/desktop
bun run dev
```

## Environment variables (very important)
- Copy `.env.template` to `.env` at the repo root and set real values.
- Most critical: `DATABASE_URL` — the Postgres connection string used by the server API. Example:

```
DATABASE_URL=postgres://postgres:mysecret@localhost:5432/scrum
```

- Also set Supabase keys for local testing:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

Troubleshooting tip: if you see `getaddrinfo ENOTFOUND base` in the terminal, that usually means the `.env` value was malformed (for example: `DATABASE_URL=DATABASE_URL="postgres://..."`). Open `.env` and ensure `DATABASE_URL` is a plain connection string (no extra `DATABASE_URL=` prefix and no stray quotes).

## Why you're seeing 500s on `/api/tasks` (short)
- The backend tries to talk to a Postgres database. If the DB host is unreachable or `DATABASE_URL` is wrong, queries will fail and the API will return 500 responses. Fixing `DATABASE_URL` or running a local Postgres instance will resolve these errors.

## Deployment notes (Vercel)
- Recommended: point Vercel to `packages/web` as the project root. Set the build command to `bun run build` or `npm run build` and output directory to `dist`.
- Add all required environment variables to the Vercel project settings (same keys as your `.env`).

## Where to look for code you’ll care about now
- Frontend UI: `packages/web/src/web`
- Server/API: `packages/web/src/api/index.ts`
- DB pool & schema: `packages/web/src/api/database`
- HTML entry: `packages/web/index.html`

## Want me to do this next?
- I can commit and push this README.
- I can help fix the `DATABASE_URL` by editing `.env` safely for local dev (I won't push secrets).
- I can add small code changes to silence Radix accessibility warnings (add `DialogTitle` where missing).

---
File: [README.md](README.md)
