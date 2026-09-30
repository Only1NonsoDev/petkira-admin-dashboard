import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const functionsUrl = (process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? "").replace(/\/$/, "");
export const envConfigured = Boolean(url && anon && functionsUrl);

// Placeholder values keep the build/prerender working when .env.local is absent;
// the UI shows a clear "not configured" message instead.
export const supabase = createClient(url || "http://127.0.0.1", anon || "missing-anon-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
