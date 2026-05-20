import { hc } from "hono/client";
import type { AppType } from "../../api/index";
import { supabase } from "./supabase";

// Always get a fresh token — never stale
async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

// Also keep a cached copy for sync access
let cachedToken = "";
supabase.auth.getSession().then(({ data }) => {
  cachedToken = data.session?.access_token ?? "";
});
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? "";
});

const client = hc<AppType>("/", {
  headers: async () => {
    // Use cached token if available, otherwise fetch fresh
    const token = cachedToken || (await getToken());
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export const api = client.api;
