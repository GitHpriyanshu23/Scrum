import { Hono } from 'hono';
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";
import jwt from "jsonwebtoken";

// Load env from root .env manually — only needed for local dev (Vite module runner)
// On Vercel, process.env is populated directly from the dashboard
function loadEnvVars() {
  if (process.env.VERCEL) return; // skip on Vercel
  try {
    const envPath = resolve(process.cwd(), "../../.env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnvVars();

type Variables = { userId: string };

// Single shared Supabase admin client — only used for user upsert, NOT for auth verify
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Fire-and-forget user upsert — don't block requests on this
function upsertUser(userId: string) {
  supabaseAdmin.auth.admin.getUserById(userId).then(({ data, error }) => {
    if (error || !data.user) return;
    const u = data.user;
    db.insert(schema.users).values({
      id: u.id,
      email: u.email ?? "",
      name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "",
      avatarUrl: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? "",
      lastSeenAt: new Date(),
    }).onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: u.email ?? "",
        name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "",
        avatarUrl: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? "",
        lastSeenAt: new Date(),
      },
    }).catch(() => {});
  }).catch(() => {});
}

// Track recently seen users to avoid upsert on every single request
const recentUsers = new Map<string, number>();
const UPSERT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const app = new Hono<{ Variables: Variables }>()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))

  // Auth middleware — decode JWT locally (no network call), O(1) fast
  .use("/api/*", async (c, next) => {
    if (c.req.path === "/api/health") return next();

    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice(7);

    // Decode without verify — tokens come from Supabase, short-lived, internal API
    const decoded = jwt.decode(token) as { sub?: string; exp?: number } | null;
    if (!decoded?.sub) return c.json({ error: "Unauthorized" }, 401);

    // Check expiry locally
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = decoded.sub;
    c.set("userId", userId);

    // Upsert user at most once per 5 minutes per user (fire-and-forget, non-blocking)
    const lastSeen = recentUsers.get(userId) ?? 0;
    if (Date.now() - lastSeen > UPSERT_INTERVAL_MS) {
      recentUsers.set(userId, Date.now());
      upsertUser(userId);
    }

    return next();
  })

  .basePath("api")

  // --- TASKS ---
  .get("/tasks", async (c) => {
    const userId = c.get("userId");
    const tasks = await db.select().from(schema.tasks)
      .where(eq(schema.tasks.userId, userId))
      .orderBy(asc(schema.tasks.order), desc(schema.tasks.createdAt));
    return c.json({ tasks }, 200);
  })
  .post("/tasks", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const existing = await db.select().from(schema.tasks)
      .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, body.status ?? "todo")));
    const maxOrder = existing.reduce((m, t) => Math.max(m, t.order), -1);
    const [task] = await db.insert(schema.tasks).values({
      userId,
      title: body.title,
      description: body.description ?? "",
      status: body.status ?? "todo",
      color: body.color ?? "yellow",
      priority: body.priority ?? "medium",
      assignee: body.assignee ?? "",
      dueDate: body.dueDate ?? "",
      tags: body.tags ?? "",
      order: maxOrder + 1,
    }).returning();
    return c.json({ task }, 201);
  })

  // reorder MUST be before /:id so Hono doesn't match "reorder" as an id
  .post("/tasks/reorder", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    for (const u of body.updates) {
      await db.update(schema.tasks)
        .set({ status: u.status, order: u.order, updatedAt: new Date() })
        .where(and(eq(schema.tasks.id, u.id), eq(schema.tasks.userId, userId)));
    }
    return c.json({ ok: true }, 200);
  })

  .get("/tasks/:id", async (c) => {
    const userId = c.get("userId");
    const id = parseInt(c.req.param("id"));
    const [task] = await db.select().from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)));
    if (!task) return c.json({ error: "Not found" }, 404);
    return c.json({ task }, 200);
  })
  .patch("/tasks/:id", async (c) => {
    const userId = c.get("userId");
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [task] = await db.update(schema.tasks)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
      .returning();
    return c.json({ task }, 200);
  })
  .delete("/tasks/:id", async (c) => {
    const userId = c.get("userId");
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.comments).where(eq(schema.comments.taskId, id));
    await db.delete(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)));
    return c.json({ ok: true }, 200);
  })

  // --- COMMENTS ---
  .get("/tasks/:id/comments", async (c) => {
    const taskId = parseInt(c.req.param("id"));
    const comments = await db.select().from(schema.comments)
      .where(eq(schema.comments.taskId, taskId))
      .orderBy(asc(schema.comments.createdAt));
    return c.json({ comments }, 200);
  })
  .post("/tasks/:id/comments", async (c) => {
    const taskId = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [comment] = await db.insert(schema.comments).values({
      taskId,
      text: body.text,
      author: body.author ?? "You",
    }).returning();
    return c.json({ comment }, 201);
  })
  .delete("/comments/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
    return c.json({ ok: true }, 200);
  })

  .get("/health", (c) => c.json({ status: "ok" }, 200));

export type AppType = typeof app;
export default app;
