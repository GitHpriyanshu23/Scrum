export type TaskStatus = "todo" | "in-progress" | "half-done" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type NoteColor = "yellow" | "pink" | "blue" | "green" | "orange" | "purple";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  color: NoteColor;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  tags: string;
  order: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface Comment {
  id: number;
  taskId: number;
  text: string;
  author: string;
  createdAt: string | number | Date;
}

export const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo",        label: "To Do",       color: "#6b7280" },
  { id: "in-progress", label: "In Progress", color: "#6366f1" },
  { id: "half-done",   label: "Half Done",   color: "#f59e0b" },
  { id: "review",      label: "Review",      color: "#8b5cf6" },
  { id: "done",        label: "Done",        color: "#22c55e" },
];

export const NOTE_COLORS: { id: NoteColor; label: string; bg: string }[] = [
  { id: "yellow", label: "Yellow", bg: "#fef08a" },
  { id: "pink",   label: "Pink",   bg: "#fbcfe8" },
  { id: "blue",   label: "Blue",   bg: "#bfdbfe" },
  { id: "green",  label: "Green",  bg: "#bbf7d0" },
  { id: "orange", label: "Orange", bg: "#fed7aa" },
  { id: "purple", label: "Purple", bg: "#e9d5ff" },
];
