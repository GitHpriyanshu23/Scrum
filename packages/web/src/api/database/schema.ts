import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase auth user id
  email: text("email").notNull(),
  name: text("name").default(""),
  avatarUrl: text("avatar_url").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("todo"),
  color: text("color").notNull().default("yellow"),
  priority: text("priority").notNull().default("medium"),
  assignee: text("assignee").default(""),
  dueDate: text("due_date").default(""),
  tags: text("tags").default(""),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  text: text("text").notNull(),
  author: text("author").default("You"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
