import { createContext, useContext, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Read session synchronously from localStorage — no network, no spinner
function getInitialSession(): Session | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Check token not expired
          const exp = parsed?.expires_at ?? 0;
          if (exp * 1000 > Date.now()) return parsed as Session;
        }
      }
    }
  } catch {}
  return null;
}

const SessionContext = createContext<Session | null | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage — instant, no flicker
  const [session, setSession] = useState<Session | null | undefined>(() => getInitialSession());

  useEffect(() => {
    // Sync with Supabase in background (refreshes token if needed)
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Only show spinner if we genuinely don't know yet (no localStorage token)
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

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (!session) return <Redirect to="/login" />;
  return <>{children}</>;
}
