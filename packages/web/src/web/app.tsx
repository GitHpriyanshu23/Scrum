import { Route, Switch } from "wouter";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/index";
import BoardPage from "./pages/board";
import TimelinePage from "./pages/timeline";
import TaskModal from "./components/TaskModal";
import LandingPage from "./pages/landing";

function AppShell() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
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
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route component={AppShell} />
    </Switch>
  );
}
