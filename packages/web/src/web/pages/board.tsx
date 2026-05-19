import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { api } from "../lib/api";
import { Task, TaskStatus, COLUMNS } from "../types";
import StickyCard from "../components/StickyCard";
import TaskModal from "../components/TaskModal";
import Loader from "../components/Loader";
import { Search, Plus } from "lucide-react";

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="flex-1 overflow-y-auto min-h-[80px] transition-colors"
      style={{ background: isOver ? "rgba(0,0,0,0.02)" : "transparent" }}
    >
      {children}
    </div>
  );
}

export default function BoardPage() {
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
  const [search, setSearch] = useState("");

  // ── Single source of truth: React Query cache ──
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.tasks.$get();
      return res.json() as Promise<{ tasks: Task[] }>;
    },
    staleTime: 30_000,       // don't refetch within 30s
    refetchOnWindowFocus: false,
  });

  const tasks: Task[] = (data as any)?.tasks ?? [];

  // Helper: write directly to cache (optimistic)
  function setTasks(updater: (prev: Task[]) => Task[]) {
    qc.setQueryData(["tasks"], (old: any) => {
      const prev: Task[] = old?.tasks ?? [];
      return { tasks: updater(prev) };
    });
  }

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: number; status: string; order: number }[]) => {
      await Promise.all(
        updates.map(u =>
          api.tasks[":id"].$patch({
            param: { id: String(u.id) },
            json: { status: u.status, order: u.order },
          })
        )
      );
    },
    onError: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function getColTasks(status: TaskStatus) {
    return tasks
      .filter(t => t.status === status)
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.order - b.order);
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const latest: Task[] = (qc.getQueryData(["tasks"]) as any)?.tasks ?? [];
    const dragged = latest.find(t => t.id === active.id);
    if (!dragged) return;

    const overIsCol = COLUMNS.some(c => c.id === over.id);
    const overTask = latest.find(t => t.id === over.id);
    const targetStatus: TaskStatus = overIsCol
      ? (over.id as TaskStatus)
      : overTask ? overTask.status : dragged.status;

    if (targetStatus === dragged.status) return;

    setTasks(prev => {
      const without = prev.filter(t => t.id !== dragged.id);
      const colItems = without.filter(t => t.status === targetStatus).sort((a, b) => a.order - b.order);
      return [...without, { ...dragged, status: targetStatus, order: colItems.length }];
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over) return;

    const latest: Task[] = (qc.getQueryData(["tasks"]) as any)?.tasks ?? [];
    const dragged = latest.find(t => t.id === active.id);
    if (!dragged) return;

    const overIsCol = COLUMNS.some(c => c.id === over.id);
    const overTask = latest.find(t => t.id === over.id);
    const targetStatus: TaskStatus = overIsCol
      ? (over.id as TaskStatus)
      : overTask ? overTask.status : dragged.status;

    // Update cache optimistically
    setTasks(prev =>
      prev.map(t => t.id === dragged.id ? { ...t, status: targetStatus } : t)
    );

    // Only save the dragged task's new status — nothing else
    reorderMutation.mutate([{ id: dragged.id, status: targetStatus, order: dragged.order }]);
  }

  if (isLoading && tasks.length === 0) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafaf8]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-12 border-b border-zinc-200 flex-shrink-0 bg-[#fafaf8]">
        <h1 className="font-nav text-base">Board</h1>
        <div className="flex items-center gap-2 border border-zinc-300 px-2.5 py-1 bg-white w-56 focus-within:border-black transition-colors">
          <Search size={12} className="text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent outline-none text-xs font-sans flex-1 placeholder:text-zinc-400"
          />
        </div>
      </header>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-0 p-5 h-full" style={{ minWidth: "max-content" }}>
            {COLUMNS.map((col, idx) => {
              const colTasks = getColTasks(col.id);
              return (
                <div
                  key={col.id}
                  className="flex flex-col flex-shrink-0 w-[260px] bg-[#fafaf8]"
                  style={{
                    borderRight: idx < COLUMNS.length - 1 ? "1px solid #e0ddd8" : "none",
                    paddingRight: "16px",
                    marginRight: "16px",
                  }}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
                      <span className="font-nav text-zinc-800">{col.label}</span>
                      <span className="font-mono text-[10px] text-zinc-400">{colTasks.length}</span>
                    </div>
                    <button
                      onClick={() => { setNewStatus(col.id); setShowNewModal(true); }}
                      className="text-zinc-300 hover:text-zinc-800 transition-colors"
                      title="Add task"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Colour bar */}
                  <div className="h-px mb-3 flex-shrink-0" style={{ background: col.color, opacity: 0.4 }} />

                  <SortableContext
                    items={colTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                    id={col.id}
                  >
                    <DroppableColumn id={col.id}>
                      {colTasks.map(task => (
                        <StickyCard
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))}
                      {colTasks.length === 0 && (
                        <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-300 text-center py-10 border border-dashed border-zinc-200">
                          Drop here
                        </div>
                      )}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeTask && (
              <div
                className={`sticky-note note-${activeTask.color} w-[244px]`}
                style={{ rotate: "1.5deg", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", cursor: "grabbing" }}
              >
                <p className="font-note-heading text-[17px] uppercase text-zinc-900">
                  {activeTask.title}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskModal
          task={tasks.find(t => t.id === selectedTask.id) ?? selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {showNewModal && (
        <TaskModal task={null} onClose={() => setShowNewModal(false)} isNew defaultStatus={newStatus} />
      )}
    </div>
  );
}
