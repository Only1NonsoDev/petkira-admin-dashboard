import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase env is not configured.");
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export async function currentAccessToken(): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your session expired. Sign in again.");
  }
  return data.session.access_token;
}
