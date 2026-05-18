import { Hono } from 'hono';
import { cors } from "hono/cors";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq, desc, asc } from "drizzle-orm";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))

  // --- TASKS ---
  .get('/tasks', async (c) => {
    const tasks = await db.select().from(schema.tasks).orderBy(asc(schema.tasks.order), desc(schema.tasks.createdAt));
    return c.json({ tasks }, 200);
  })
  .post('/tasks', async (c) => {
    const body = await c.req.json();
    // get max order in column
    const existing = await db.select().from(schema.tasks).where(eq(schema.tasks.status, body.status ?? "todo"));
    const maxOrder = existing.reduce((m, t) => Math.max(m, t.order), -1);
    const [task] = await db.insert(schema.tasks).values({
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
  .get('/tasks/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!task) return c.json({ error: 'Not found' }, 404);
    return c.json({ task }, 200);
  })
  .patch('/tasks/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const [task] = await db.update(schema.tasks)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.tasks.id, id))
      .returning();
    return c.json({ task }, 200);
  })
  .delete('/tasks/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    await db.delete(schema.comments).where(eq(schema.comments.taskId, id));
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    return c.json({ ok: true }, 200);
  })

  // Bulk reorder endpoint
  .post('/tasks/reorder', async (c) => {
    const body = await c.req.json(); // { updates: [{id, status, order}] }
    for (const u of body.updates) {
      await db.update(schema.tasks)
        .set({ status: u.status, order: u.order, updatedAt: new Date() })
        .where(eq(schema.tasks.id, u.id));
    }
    return c.json({ ok: true }, 200);
  })

  // --- COMMENTS ---
  .get('/tasks/:id/comments', async (c) => {
    const taskId = parseInt(c.req.param('id'));
    const comments = await db.select().from(schema.comments)
      .where(eq(schema.comments.taskId, taskId))
      .orderBy(asc(schema.comments.createdAt));
    return c.json({ comments }, 200);
  })
  .post('/tasks/:id/comments', async (c) => {
    const taskId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const [comment] = await db.insert(schema.comments).values({
      taskId,
      text: body.text,
      author: body.author ?? "You",
    }).returning();
    return c.json({ comment }, 201);
  })
  .delete('/comments/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
    return c.json({ ok: true }, 200);
  })

  .get('/health', (c) => c.json({ status: 'ok' }, 200));

export type AppType = typeof app;
export default app;
