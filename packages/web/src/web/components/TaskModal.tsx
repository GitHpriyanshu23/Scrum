import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Task, Comment, NOTE_COLORS, COLUMNS, NoteColor, TaskStatus, TaskPriority } from "../types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Trash2, Send, MessageSquare, Calendar, User, Tag } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  task: Task | null;
  onClose: () => void;
  isNew?: boolean;
  defaultStatus?: TaskStatus;
}

const priorityOptions: TaskPriority[] = ["low", "medium", "high"];

function noteColorHex(c: NoteColor): string {
  const m: Record<NoteColor, string> = {
    yellow: "#fef9c3", pink: "#fce7f3", blue: "#dbeafe",
    green: "#dcfce7", orange: "#ffedd5", purple: "#f3e8ff",
  };
  return m[c] ?? "#fef9c3";
}

export default function TaskModal({ task, onClose, isNew = false, defaultStatus = "todo" }: Props) {
  const qc = useQueryClient();
  const [title, setTitle]         = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus]       = useState<TaskStatus>(task?.status ?? defaultStatus);
  const [color, setColor]         = useState<NoteColor>(task?.color ?? "yellow");
  const [priority, setPriority]   = useState<TaskPriority>(task?.priority ?? "medium");
  const [assignee, setAssignee]   = useState(task?.assignee ?? "");
  const [dueDate, setDueDate]     = useState(task?.dueDate ?? "");
  const [tags, setTags]           = useState(task?.tags ?? "");
  const [comment, setComment]     = useState("");
  const [editing, setEditing]     = useState(isNew);

  const { data: commentsData } = useQuery({
    queryKey: ["comments", task?.id],
    queryFn: async () => {
      if (!task?.id) return { comments: [] };
      const res = await api.tasks[":id"].comments.$get({ param: { id: String(task.id) } });
      return res.json();
    },
    enabled: !!task?.id,
  });
  const comments: Comment[] = (commentsData as any)?.comments ?? [];

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await api.tasks.$post({ json: { title, description, status, color, priority, assignee, dueDate, tags } });
      return res.json() as Promise<{ task: Task }>;
    },
    onSuccess: (data) => {
      const newTask = (data as any).task as Task;
      // Inject into cache immediately — no refetch needed
      qc.setQueryData(["tasks"], (old: any) => {
        const prev: Task[] = old?.tasks ?? [];
        return { tasks: [...prev, newTask] };
      });
      onClose();
    },
  });

  const updateTask = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const res = await api.tasks[":id"].$patch({ param: { id: String(task.id) }, json: { title, description, status, color, priority, assignee, dueDate, tags } });
      return res.json() as Promise<{ task: Task }>;
    },
    onSuccess: (data) => {
      const updated = (data as any).task as Task;
      qc.setQueryData(["tasks"], (old: any) => {
        const prev: Task[] = old?.tasks ?? [];
        return { tasks: prev.map(t => t.id === updated.id ? updated : t) };
      });
      setEditing(false);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      if (!task) return;
      await api.tasks[":id"].$delete({ param: { id: String(task.id) } });
    },
    onSuccess: () => {
      qc.setQueryData(["tasks"], (old: any) => {
        const prev: Task[] = old?.tasks ?? [];
        return { tasks: prev.filter(t => t.id !== task?.id) };
      });
      onClose();
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!task || !comment.trim()) return;
      const res = await api.tasks[":id"].comments.$post({ param: { id: String(task.id) }, json: { text: comment } });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", task?.id] }); setComment(""); },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.comments[":id"].$delete({ param: { id: String(id) } });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", task?.id] }),
  });

  function handleSave() {
    if (!title.trim()) return;
    if (isNew) createTask.mutate();
    else updateTask.mutate();
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 overflow-hidden">
        {/* Coloured note stripe at top */}
        <div className="h-1.5 w-full" style={{ background: noteColorHex(color) }} />

        <DialogHeader className="pb-3">
          {/* Colour picker */}
          <div className="flex items-center gap-1.5 mb-3">
            {NOTE_COLORS.map(nc => (
              <button
                key={nc.id}
                onClick={() => setColor(nc.id)}
                title={nc.label}
                className={cn(
                  "w-4 h-4 border transition-transform hover:scale-110",
                  color === nc.id ? "border-black scale-110" : "border-transparent"
                )}
                style={{ background: nc.bg }}
              />
            ))}
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 ml-2">Note colour</span>
          </div>

          {editing || isNew ? (
            <textarea
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="TASK TITLE"
              className="font-display text-3xl font-black uppercase tracking-tight leading-none bg-transparent border-b border-zinc-300 outline-none resize-none w-full pb-1 placeholder:text-zinc-300"
              rows={2}
            />
          ) : (
            <DialogTitle>{task?.title}</DialogTitle>
          )}

          {/* Status breadcrumb */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="label-caps">Status</span>
            {editing || isNew ? (
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="font-mono text-[10px] uppercase tracking-wider border border-zinc-300 bg-white px-2 py-0.5 outline-none focus:border-black"
              >
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            ) : (
              <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider text-zinc-600 border-zinc-300">
                {COLUMNS.find(c => c.id === status)?.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="label-caps">Priority</label>
              <div className="flex gap-1.5">
                {priorityOptions.map(p => (
                  <button
                    key={p}
                    disabled={!editing && !isNew}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-wider px-2 py-1 border transition-all",
                      priority === p
                        ? p === "high"   ? "bg-red-600 text-white border-red-600"
                          : p === "medium" ? "bg-amber-500 text-white border-amber-500"
                          : "bg-green-600 text-white border-green-600"
                        : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400",
                      "disabled:opacity-50 disabled:cursor-default"
                    )}
                  >{p}</button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="label-caps flex items-center gap-1"><User size={9} /> Assignee</label>
              <Input
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                disabled={!editing && !isNew}
                placeholder="Name..."
                className="h-7 text-xs"
              />
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <label className="label-caps flex items-center gap-1"><Calendar size={9} /> Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                disabled={!editing && !isNew}
                className="h-7 text-xs"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="label-caps flex items-center gap-1"><Tag size={9} /> Tags</label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={!editing && !isNew}
                placeholder="bug, ui, backend"
                className="h-7 text-xs"
              />
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1.5">
            <label className="label-caps">Description</label>
            {editing || isNew ? (
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Write details, context, links..."
                rows={4}
              />
            ) : (
              <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed min-h-[40px]">
                {task?.description || <span className="text-zinc-300 italic text-xs">No description</span>}
              </p>
            )}
          </div>

          {/* Actions */}
          {(editing || isNew) && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!title.trim() || createTask.isPending || updateTask.isPending}
                className="flex-1"
              >
                {createTask.isPending || updateTask.isPending ? "Saving..." : isNew ? "Create Task" : "Save Changes"}
              </Button>
              {!isNew && (
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              )}
            </div>
          )}

          {!isNew && !editing && (
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask.mutate()}
                disabled={deleteTask.isPending}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Delete
              </Button>
            </div>
          )}

          {/* Comments */}
          {!isNew && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="label-caps flex items-center gap-1.5">
                  <MessageSquare size={10} /> Comments ({comments.length})
                </h3>

                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="group flex gap-2">
                      <div className="flex-1 bg-zinc-50 border border-zinc-200 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{c.author}</span>
                          <span className="font-mono text-[9px] text-zinc-400">
                            {new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700">{c.text}</p>
                      </div>
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500 transition-all"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">No comments yet</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment.mutate(); } }}
                    placeholder="Add a comment..."
                    className="flex-1 h-8 text-xs"
                  />
                  <Button
                    size="icon"
                    onClick={() => addComment.mutate()}
                    disabled={!comment.trim() || addComment.isPending}
                  >
                    <Send size={13} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
