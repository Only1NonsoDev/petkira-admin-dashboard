import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_ADMIN_EMAIL, isDemoMode } from "./demo";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export type AdminCtx = { db: SupabaseClient; userId: string; email: string | undefined };

/**
 * Fail-closed guard for every API route: localhost only, valid Supabase JWT, and is_admin() === true.
 * The returned client carries the caller's JWT so RLS still applies to any query.
 */
export async function requireAdmin(req: Request): Promise<AdminCtx> {
  if (isDemoMode) {
    // Demo: no JWT check and no Supabase access. Routes short-circuit to canned data before using `db`.
    const db = createClient(URL_ || "http://127.0.0.1", ANON || "demo-anon-key", { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    return { db, userId: "demo-admin", email: DEMO_ADMIN_EMAIL };
  }
  const host = (req.headers.get("host") ?? "").replace(/:\d+$/, "");
  if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) throw new ApiError(403, "Local access only.");
  if (!URL_ || !ANON) throw new ApiError(500, "Supabase env is not configured.");

  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!m) throw new ApiError(401, "Missing bearer token.");
  const token = m[1];

  const db = createClient(URL_, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: u, error: uErr } = await db.auth.getUser(token);
  if (uErr || !u.user) throw new ApiError(401, "Invalid or expired session.");
  const { data: isAdmin, error: aErr } = await db.rpc("is_admin");
  if (aErr || isAdmin !== true) throw new ApiError(403, "Not an admin account.");
  return { db, userId: u.user.id, email: u.user.email };
}

export function fail(e: unknown): Response {
  if (e instanceof ApiError) return Response.json({ error: e.message, code: e.code }, { status: e.status });
  console.error("[api]", e instanceof Error ? e.message : e);
  return Response.json({ error: "Unexpected server error." }, { status: 500 });
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }
}

/* -------- OpenAI / Resend (server only) -------- */
export async function openAiJson(system: string, user: string): Promise<any> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ApiError(503, "OPENAI_API_KEY is not set in .env.local — AI features are disabled.", "no_openai_key");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(502, `OpenAI error (${res.status}): ${data?.error?.message ?? "request failed"}`);
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    throw new ApiError(502, "OpenAI returned an unreadable response.");
  }
}

export const resendFrom = () => process.env.RESEND_FROM_EMAIL || "PetKira <onboarding@resend.dev>";

export async function resendCall(path: string, payload: unknown): Promise<any> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new ApiError(503, "RESEND_API_KEY is not set in .env.local — email sending is disabled.", "no_resend_key");
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(502, `Resend error (${res.status}): ${data?.message ?? "request failed"}`);
  return data;
}

export const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
