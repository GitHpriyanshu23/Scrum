import { Route, Switch } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/landing";
import ProtectedRoute, { useSession } from "./components/ProtectedRoute";
import Dashboard from "./pages/index";
import BoardPage from "./pages/board";
import TimelinePage from "./pages/timeline";
import TaskModal from "./components/TaskModal";
import LoginPage from "./pages/login";
import { api } from "./lib/api";
import { Task } from "./types";

function AppShell() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const session = useSession();
  const qc = useQueryClient();

  // Only prefetch AFTER we have a valid session+token
  useEffect(() => {
    if (!session?.access_token) return;
    qc.prefetchQuery({
      queryKey: ["tasks"],
      queryFn: async () => {
        const res = await api.tasks.$get();
        return res.json() as Promise<{ tasks: Task[] }>;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [session?.access_token]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#fafaf8]" style={{ overflow: "hidden" }}>
        <Sidebar
          onNewTask={() => setShowNewTask(true)}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />
        <main className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/app" component={Dashboard} />
            <Route path="/app/board" component={BoardPage} />
            <Route path="/app/timeline" component={TimelinePage} />
          </Switch>
        </main>
        {showNewTask && (
          <TaskModal
            task={null}
            onClose={() => setShowNewTask(false)}
            isNew
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={AppShell} />
    </Switch>
  );
}
