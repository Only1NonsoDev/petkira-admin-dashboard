import { supabase } from "./supabase";
import { isDemoMode } from "./demo";
import { demoAnalysis, demoFeedback, demoSegmentCount, demoSupportDraft } from "./demo-data";
import type { Segment } from "./format";

/** Canned responses for demo mode; mirrors the shapes returned by the real /api routes. */
function demoPost(path: string, body: unknown): unknown {
  const b = (body ?? {}) as { segment?: Segment; dryRun?: boolean };
  switch (path) {
    case "/api/ai/feedback-analysis":
      return { analysis: demoAnalysis, analysed: demoFeedback.length };
    case "/api/ai/support-draft":
      return { reply: demoSupportDraft };
    case "/api/email/send":
      return { ok: true, id: "demo-email-id" };
    case "/api/email/broadcast": {
      const n = demoSegmentCount(b.segment ?? "all");
      return b.dryRun ? { recipients: n } : { ok: true, sent: n, total: n, failedBatches: 0, firstError: null };
    }
    default:
      throw new Error(`Demo mode: ${path} is not available.`);
  }
}

/** POST to a local Next API route with the admin's Supabase JWT. Keys live server-side only. */
export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  if (isDemoMode) {
    await new Promise((r) => setTimeout(r, 600)); // feel like a real round trip
    return demoPost(path, body) as T;
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `Request failed (${res.status})`) as Error & { code?: string };
    err.code = json?.code;
    throw err;
  }
  return json as T;
}

/** Unwrap a supabase-js result or throw with a readable message. */
export function must<T>(r: { data: T | null; error: { message: string } | null }, label: string): T {
  if (r.error) throw new Error(`${label}: ${r.error.message}`);
  return (r.data ?? ([] as unknown)) as T;
}
