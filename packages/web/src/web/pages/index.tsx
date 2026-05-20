import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Task, COLUMNS } from "../types";
import { Link } from "wouter";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import Loader from "../components/Loader";

function noteColorHex(c: string) {
  const m: Record<string, string> = {
    yellow: "#fef9c3", pink: "#fce7f3", blue: "#dbeafe",
    green: "#dcfce7",  orange: "#ffedd5", purple: "#f3e8ff",
  };
  return m[c] ?? "#fef9c3";
}

function Stat({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="border border-zinc-200 p-5 bg-white">
      <div className="font-note-heading text-4xl leading-none mb-1">
        {value}
      </div>
      <div className="label-caps">{label}</div>
    </div>
  );
}

export default function Dashboard() {
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
  const total      = tasks.length;
  const done       = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const halfDone   = tasks.filter(t => t.status === "half-done").length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;

  const recent = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const highPri = tasks.filter(t => t.priority === "high" && t.status !== "done");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafaf8]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-12 border-b border-zinc-200 flex-shrink-0 bg-[#fafaf8]">
        <h1 className="font-nav text-base">Dashboard</h1>
        <Link href="/board">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-black transition-colors cursor-pointer">
            Open Board →
          </span>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Total Tasks"  value={total} />
              <Stat label="Completed"    value={done} />
              <Stat label="In Progress"  value={inProgress} />
              <Stat label="Half Done"    value={halfDone} />
            </div>

            {/* Progress bar */}
            <div className="border border-zinc-200 p-5 bg-white space-y-3">
              <div className="flex items-end justify-between">
                <span className="label-caps">Overall Completion</span>
                <span className="font-note-heading text-5xl leading-none">{pct}%</span>
              </div>
              <div className="h-1.5 bg-zinc-100 w-full">
                <div className="h-1.5 bg-black transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {COLUMNS.map(col => {
                  const count = tasks.filter(t => t.status === col.id).length;
                  const p = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={col.id}>
                      <div className="label-caps mb-1 truncate">{col.label}</div>
                      <div className="h-0.5 bg-zinc-100 w-full">
                        <div className="h-0.5 transition-all" style={{ width: `${p}%`, background: col.color }} />
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500 mt-0.5">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Recent */}
              <div className="border border-zinc-200 bg-white">
                <div className="px-5 py-3 border-b border-zinc-200">
                  <span className="font-nav">Recent Activity</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {recent.length === 0 && (
                    <p className="px-5 py-4 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                      No tasks yet.{" "}
                      <Link href="/board">
                        <span className="underline cursor-pointer hover:text-black">Start on the board →</span>
                      </Link>
                    </p>
                  )}
                  {recent.map(t => {
                    const col = COLUMNS.find(c => c.id === t.status);
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                        <div
                          className="w-2 h-full min-h-[32px] flex-shrink-0"
                          style={{ background: noteColorHex(t.color) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-note-heading text-base text-zinc-900 truncate">
                            {t.title}
                          </p>
                          <p className="label-caps mt-0.5">
                            {new Date(t.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span
                          className="font-mono text-[9px] uppercase tracking-wider flex-shrink-0 px-1.5 py-0.5 border"
                          style={{ borderColor: col?.color + "60", color: col?.color, background: col?.color + "10" }}
                        >
                          {col?.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* High priority */}
              <div className="border border-zinc-200 bg-white">
                <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
                  <span className="font-nav">High Priority</span>
                  <Badge variant="high">{highPri.length}</Badge>
                </div>
                <div className="divide-y divide-zinc-100">
                  {highPri.length === 0 && (
                    <p className="px-5 py-4 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                      None — great work
                    </p>
                  )}
                  {highPri.slice(0, 8).map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                      <div className="w-2 min-h-[32px] flex-shrink-0 h-full" style={{ background: noteColorHex(t.color) }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-note-heading text-base text-zinc-900 truncate">
                          {t.title}
                        </p>
                        <p className="label-caps mt-0.5">
                          {COLUMNS.find(c => c.id === t.status)?.label}
                          {t.dueDate && ` · Due ${new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
