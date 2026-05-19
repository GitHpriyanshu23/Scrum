import { hc } from "hono/client";
import type { AppType } from "../../api";
import { supabase } from "./supabase";

// Cache token at module level — no async call on every request
let cachedToken = "";

// Warm up immediately
supabase.auth.getSession().then(({ data }) => {
  cachedToken = data.session?.access_token ?? "";
});

// Keep in sync with auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? "";
});

const client = hc<AppType>("/", {
  headers: () => {
    return cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {};
  },
});

export const api = client.api;
