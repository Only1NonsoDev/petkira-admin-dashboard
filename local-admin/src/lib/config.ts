/**
 * Public client configuration only.
 * Next inlines NEXT_PUBLIC_* when referenced directly. Do not read these
 * through a dynamic process.env[name] lookup — that stays empty in the browser.
 */
export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
export const functionsUrl = (process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? "")
  .trim()
  .replace(/\/$/, "");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && functionsUrl);

export const adminManageUrl = functionsUrl ? `${functionsUrl}/admin-manage` : "";
