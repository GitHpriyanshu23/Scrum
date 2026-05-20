import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Task, COLUMNS } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import Loader from "../components/Loader";

function noteColorHex(c: string) {
  const m: Record<string, string> = {
    yellow: "#fef9c3", pink: "#fce7f3", blue: "#dbeafe",
    green: "#dcfce7",  orange: "#ffedd5", purple: "#f3e8ff",
  };
  return m[c] ?? "#fef9c3";
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function TimelinePage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [picked, setPicked] = useState<Task | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.tasks.$get();
      return res.json() as Promise<{ tasks: Task[] }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const tasks: Task[] = (data as any)?.tasks ?? [];

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = new Date(year, month, 1).getDay();

  function tasksForDay(d: number) {
    const ds = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return tasks.filter(t => t.dueDate?.startsWith(ds));
  }

  function prevMonth() { month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1); }
  function nextMonth() { month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1); }

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const noDueDate = tasks.filter(t => !t.dueDate);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafaf8]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-12 border-b border-zinc-200 flex-shrink-0 bg-[#fafaf8]">
        <h1 className="font-nav text-base">Timeline</h1>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-black">
            <ChevronLeft size={16} />
          </button>
          <span className="font-nav w-36 text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-black">
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            className="font-mono text-[9px] uppercase tracking-widest border border-zinc-300 px-2 py-1 ml-2 hover:border-black hover:text-black transition-colors text-zinc-500"
          >
            Today
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="border border-zinc-200 bg-white overflow-hidden">
              {/* Weekday row */}
              <div className="grid grid-cols-7 border-b border-zinc-200">
                {DAYS.map(d => (
                  <div key={d} className="text-center py-2 label-caps border-r last:border-r-0 border-zinc-100">
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstWeekDay }).map((_, i) => (
                  <div key={`e${i}`} className="min-h-[80px] border-r border-b border-zinc-100" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dayTasks = tasksForDay(d);
                  const today_ = isToday(d);
                  return (
                    <div
                      key={d}
                      className="min-h-[80px] p-1.5 border-r border-b border-zinc-100 last:border-r-0"
                      style={{ background: today_ ? "#fafaf8" : "white" }}
                    >
                      <div
                        className="font-mono text-[10px] w-5 h-5 flex items-center justify-center mb-1"
                        style={{
                          background: today_ ? "#0a0a0a" : "transparent",
                          color: today_ ? "#fafaf8" : "#6b6b6b",
                        }}
                      >
                        {d}
                      </div>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map(t => (
                          <div
                            key={t.id}
                            onClick={() => setPicked(picked?.id === t.id ? null : t)}
                            className="font-note-heading text-[11px] px-1 py-0.5 truncate cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ background: noteColorHex(t.color), color: "#1a1a1a" }}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="label-caps px-1">+{dayTasks.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task list by status */}
            <div className="border border-zinc-200 bg-white">
              <div className="px-5 py-3 border-b border-zinc-200">
                <span className="font-nav">All Tasks</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {COLUMNS.map(col => {
                  const ct = tasks.filter(t => t.status === col.id);
                  if (!ct.length) return null;
                  return (
                    <div key={col.id} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
                        <span className="font-nav">{col.label}</span>
                        <span className="font-mono text-[10px] text-zinc-400">{ct.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ct.map(t => (
                          <div
                            key={t.id}
                            onClick={() => setPicked(picked?.id === t.id ? null : t)}
                            className="font-note-heading text-sm px-2 py-1 cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ background: noteColorHex(t.color), color: "#1a1a1a" }}
                          >
                            {t.title}
                            {t.dueDate && (
                              <span className="font-mono text-[8px] ml-1.5 opacity-60">
                                {new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="px-5 py-6 label-caps text-zinc-300">No tasks yet</div>
                )}
              </div>
            </div>

            {noDueDate.length > 0 && (
              <div className="border border-zinc-200 bg-white">
                <div className="px-5 py-3 border-b border-zinc-200">
                  <span className="font-nav">No Due Date</span>
                  <span className="font-mono text-[10px] text-zinc-400 ml-2">{noDueDate.length}</span>
                </div>
                <div className="px-5 py-3 flex flex-wrap gap-1.5">
                  {noDueDate.map(t => (
                    <div
                      key={t.id}
                      className="font-note-heading text-sm px-2 py-1 opacity-70"
                      style={{ background: noteColorHex(t.color), color: "#1a1a1a" }}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating task detail */}
      {picked && (
        <div
          className="fixed bottom-5 right-5 w-64 border border-zinc-300 bg-white shadow-lg animate-modal p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-full h-0.5 mb-2"
              style={{ background: noteColorHex(picked.color) }}
            />
          </div>
          <p className="font-note-heading text-base text-zinc-900 mb-1">
            {picked.title}
          </p>
          <div className="space-y-0.5">
            <p className="label-caps">{COLUMNS.find(c => c.id === picked.status)?.label}</p>
            {picked.assignee && <p className="label-caps">Assignee: {picked.assignee}</p>}
            {picked.dueDate && (
              <p className="label-caps">
                Due: {new Date(picked.dueDate).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <button
            onClick={() => setPicked(null)}
            className="absolute top-3 right-3 font-mono text-[10px] text-zinc-400 hover:text-black"
          >×</button>
        </div>
      )}
    </div>
  );
}
