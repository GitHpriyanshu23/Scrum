import { Route, Switch } from "wouter";
import { useState, lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/landing";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";

// Lazy load heavy pages — keeps initial bundle small
const Dashboard = lazy(() => import("./pages/index"));
const BoardPage = lazy(() => import("./pages/board"));
const TimelinePage = lazy(() => import("./pages/timeline"));
const TaskModal = lazy(() => import("./components/TaskModal"));
const LoginPage = lazy(() => import("./pages/login"));

const PageLoader = () => <Loader />;

function AppShell() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#fafaf8]" style={{ overflow: "hidden" }}>
        <Sidebar
          onNewTask={() => setShowNewTask(true)}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/app" component={Dashboard} />
              <Route path="/app/board" component={BoardPage} />
              <Route path="/app/timeline" component={TimelinePage} />
            </Switch>
          </Suspense>
        </main>
        {showNewTask && (
          <Suspense fallback={null}>
            <TaskModal
              task={null}
              onClose={() => setShowNewTask(false)}
              isNew
            />
          </Suspense>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route component={AppShell} />
      </Switch>
    </Suspense>
  );
}
