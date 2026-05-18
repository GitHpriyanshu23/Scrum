import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("todo"), // todo | in-progress | half-done | review | done
  color: text("color").notNull().default("yellow"), // yellow | pink | blue | green | orange | purple
  priority: text("priority").notNull().default("medium"), // low | medium | high
  assignee: text("assignee").default(""),
  dueDate: text("due_date").default(""),
  tags: text("tags").default(""), // comma-separated
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull(),
  text: text("text").notNull(),
  author: text("author").default("You"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
