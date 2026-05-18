import { Link, useLocation } from "wouter";
import { LayoutDashboard, Columns3, Clock, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const nav = [
  { href: "/app",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/board",    icon: Columns3,        label: "Board"     },
  { href: "/app/timeline", icon: Clock,           label: "Timeline"  },
];

interface Props {
  onNewTask?: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ onNewTask, collapsed, onToggle }: Props) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen flex-shrink-0 bg-[#fafaf8] border-r border-zinc-200 transition-all duration-200",
        collapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Wordmark / toggle row */}
      <div className={cn(
        "flex items-center border-b border-zinc-200 flex-shrink-0",
        collapsed ? "justify-center px-0 pt-4 pb-4" : "justify-between px-2 pt-4 pb-3"
      )}>
        {!collapsed && (
          <div className="flex items-center" style={{ gap: "1px" }}>
            {["S", "C", "R", "U", "M"].map((l) => (
              <img key={l} src={`/logo/${l}.png?v=9`} className="h-7 w-auto" alt={l} />
            ))}
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-zinc-400 hover:text-black transition-colors p-1 flex-shrink-0"
          title={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* New Task */}
      <div className={cn("py-3", collapsed ? "px-2" : "px-4")}>
        {collapsed ? (
          <button
            onClick={onNewTask}
            className="w-full flex items-center justify-center p-2 bg-black text-white hover:bg-zinc-800 transition-colors"
            title="New Task"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        ) : (
          <Button onClick={onNewTask} size="sm" className="w-full gap-1.5">
            <Plus size={13} strokeWidth={2.5} />
            New Task
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <span
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center cursor-pointer transition-colors",
                  collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                  "font-nav",
                  active
                    ? "bg-black text-white"
                    : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                )}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 1.75} />
                {!collapsed && label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-zinc-200">
          <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">Project Board</p>
          <p className="font-mono text-[10px] text-zinc-300 mt-0.5">v1.0</p>
        </div>
      )}
    </aside>
  );
}
