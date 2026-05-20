import { createContext, useContext, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ── Session context — resolved once at app root, never again ──
const SessionContext = createContext<Session | null | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Only ONE global spinner — only on cold app start
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "20px", height: "20px", border: "2px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

// ── Guard — no spinner, just redirect ──
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (!session) return <Redirect to="/login" />;
  return <>{children}</>;
}
