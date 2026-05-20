import { Hono } from 'hono';
import { cors } from "hono/cors";
import { db } from "./database/index.js";
import * as schema from "./database/schema.js";
import { eq, and, desc, asc } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";
import jwt from "jsonwebtoken";

// Load env from root .env manually — only needed for local dev
function loadEnvVars() {
  if (process.env.VERCEL) return;
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

// Upsert user directly from JWT claims — no extra network call needed
// Supabase JWT contains email + user_metadata
function upsertUser(decoded: any) {
  const userId = decoded.sub;
  const email = decoded.email ?? "";
  const meta = decoded.user_metadata ?? {};
  const name = meta.full_name ?? meta.name ?? "";
  const avatarUrl = meta.avatar_url ?? meta.picture ?? "";

  db.insert(schema.users)
    .values({ id: userId, email, name, avatarUrl, lastSeenAt: new Date() })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: { email, name, avatarUrl, lastSeenAt: new Date() },
    })
    .catch((err: any) => {
      console.error("upsertUser failed:", err?.message ?? err);
    });
}

const app = new Hono<{ Variables: Variables }>()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))

  // Auth middleware — decode JWT locally, no network call
  .use("/api/*", async (c, next) => {
    if (c.req.path === "/api/health") return next();

    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice(7);

    const decoded = jwt.decode(token) as { sub?: string; exp?: number; email?: string; user_metadata?: any } | null;
    if (!decoded?.sub) return c.json({ error: "Unauthorized" }, 401);

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: "Token expired" }, 401);
    }

    c.set("userId", decoded.sub);

    // Always upsert — serverless has no persistent memory so in-memory cache is useless
    // onConflictDoUpdate is idempotent and fast
    upsertUser(decoded);

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
    const maxOrder = existing.reduce((m: number, t: any) => Math.max(m, t.order), -1);
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
