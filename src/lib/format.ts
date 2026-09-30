export const num = (v: unknown) => Number(v) || 0;

export function timeAgo(d?: string | null): string {
  if (!d) return "—";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
}

export function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString("en-GB");
}

export function formatEventName(name: unknown): string {
  return String(name ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- Profiles -> UI users ---------- */
export type UserStatus = "trial" | "paid" | "founding" | "churned";
export type AppUser = {
  id: string;
  email: string;
  plan: string; // raw subscription_status
  status: UserStatus;
  is_founding: boolean;
  created_at: string | null;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  subscription_status: string | null;
  founding_member: boolean | null;
  created_at: string | null;
  deleted_at: string | null;
};

export const PROFILE_COLS = "id,email,subscription_status,founding_member,created_at,deleted_at";

export function mapProfile(p: ProfileRow): AppUser {
  const founding = !!p.founding_member;
  const sub = p.subscription_status ?? "free";
  const status: UserStatus = founding ? "founding" : sub === "pro" || sub === "family" ? "paid" : p.deleted_at ? "churned" : "trial";
  return { id: p.id, email: p.email ?? "", plan: sub, status, is_founding: founding, created_at: p.created_at };
}

export const isPaid = (u: AppUser) => u.status === "paid" || u.status === "founding";

export type Segment = "all" | "free" | "paid" | "founding";
export function inSegment(u: AppUser, seg: Segment): boolean {
  if (seg === "all") return true;
  if (seg === "free") return u.status === "trial";
  if (seg === "paid") return u.status === "paid";
  return u.is_founding;
}

/** Signups per calendar day for the last `n` days (local time). */
export function signupsByDay(users: AppUser[], n = 7): { labels: string[]; values: number[] } {
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const buckets: { key: string; label: string; n: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ key: key(d), label: d.toLocaleDateString("en-GB", { weekday: "short" }), n: 0 });
  }
  for (const u of users) {
    if (!u.created_at) continue;
    const k = key(new Date(u.created_at));
    const b = buckets.find((x) => x.key === k);
    if (b) b.n++;
  }
  return { labels: buckets.map((b) => b.label), values: buckets.map((b) => b.n) };
}

/* ---------- Sentry ---------- */
export type SentryRow = {
  id: string;
  sentry_issue_id: string | null;
  title: string | null;
  culprit: string | null;
  level: string | null;
  status: string | null;
  action: string | null;
  platform: string | null;
  first_seen: string | null;
  last_seen: string | null;
  times_seen: number | null;
  permalink: string | null;
  received_at: string | null;
};
export const SENTRY_COLS = "id,sentry_issue_id,title,culprit,level,status,action,platform,first_seen,last_seen,times_seen,permalink,received_at";

export type DashStatus = "new" | "in_progress" | "fixed" | "notified";
export function sentryDashStatus(r: SentryRow): DashStatus {
  return r.status === "resolved" ? "fixed" : r.status === "ignored" ? "notified" : r.action === "assigned" ? "in_progress" : "new";
}

export function plainEnglishSentry(bug: Pick<SentryRow, "title" | "culprit">): string {
  const t = (bug.title || "").toLowerCase();
  const c = (bug.culprit || "").toLowerCase();
  if (t.includes("watchdog")) return "App used too much memory and the OS shut it down forcefully.";
  if (t.includes("anr") || t.includes("hang")) return "App froze and stopped responding for over 2 seconds.";
  if (t.includes("revenuecat") || t.includes("customerinfo") || t.includes("identity")) return "In-app purchase system could not confirm the user's account.";
  if (t.includes("feedback") || t.includes("url") || c.includes("dashboardscreen")) return "Feedback button URL is broken — tapping it goes nowhere.";
  if (t.includes("null") || t.includes("npe")) return "App tried to use data that didn't exist yet (null crash).";
  if (t.includes("network") || t.includes("timeout")) return "A network request timed out or lost connection mid-way.";
  return bug.culprit ? `Crash in ${bug.culprit}.` : "Unexpected error — open it in Sentry for full details.";
}

export function safeHttpUrl(u?: string | null): string | null {
  return u && /^https?:\/\//i.test(u) ? u : null;
}

/* ---------- Bugs ---------- */
export type BugRow = {
  id: string;
  title: string | null;
  error_message: string | null;
  stack_trace: string | null;
  affected_count: number | null;
  ai_diagnosis: string | null;
  status: string | null;
  created_at: string | null;
  fixed_at: string | null;
};
export const BUG_COLS = "id,title,error_message,stack_trace,affected_count,ai_diagnosis,status,created_at,fixed_at";

export function bugPrompt(b: BugRow): string {
  return `# PetKira Bug Fix Task

## Bug: ${b.title ?? "—"}
**Status:** ${b.status ?? "—"}
**Affected Users:** ${b.affected_count ?? "unknown"}
**Reported:** ${fmtDate(b.created_at)}

## Error
\`\`\`
${b.error_message || "No error message"}
\`\`\`

## Stack Trace
\`\`\`
${b.stack_trace || "No stack trace available"}
\`\`\`

## AI Diagnosis
${b.ai_diagnosis || "No AI diagnosis yet"}

## Task
Please investigate and fix this bug in the PetKira React Native / Expo codebase.
1. Find the relevant file(s) mentioned in the stack trace
2. Diagnose the root cause
3. Write the fix
4. Explain what you changed and why
5. Confirm no other parts of the app are affected

Project: PetKira (React Native / Expo / EAS Build)
`;
}

export function sentryPrompt(b: SentryRow): string {
  return `=== PETKIRA CRASH REPORT ===
Title: ${b.title || "—"}
Culprit: ${b.culprit || "—"}
Severity: ${b.level || "—"}
Status: ${b.status || "—"}
Platform: ${b.platform || "—"}
Times seen: ${b.times_seen ?? "—"}
Reported: ${fmtDateTime(b.received_at)}
Sentry Link: ${b.permalink || "—"}

TASK: Analyze this crash in the PetKira Expo React Native codebase and suggest the fix. The codebase uses Expo EAS, React Native, and Supabase. Focus on the most likely cause and show me which file to edit and what to change.
`;
}

/* ---------- Feedback / support ---------- */
export type FeedbackRow = {
  id: string;
  user_email: string | null;
  rating: number | null;
  category: string | null;
  message: string | null;
  what_broke: string | null;
  whats_missing: string | null;
  used_most: string[] | string | null; // may be jsonb array or text
  follow_up_email: string | null;
  created_at: string | null;
  app_version: string | null;
};
export const FEEDBACK_COLS = "id,user_email,rating,category,message,what_broke,whats_missing,used_most,follow_up_email,created_at,app_version";

/** Prefer free-text message; else compose structured fields for display/search/AI. */
export function feedbackDisplayText(f: Pick<FeedbackRow, "message" | "what_broke" | "whats_missing" | "used_most">): string {
  const msg = (f.message ?? "").trim();
  if (msg) return msg;
  const parts: string[] = [];
  const broke = (f.what_broke ?? "").trim();
  const missing = (f.whats_missing ?? "").trim();
  let used = "";
  if (Array.isArray(f.used_most)) used = f.used_most.filter(Boolean).join(", ");
  else if (typeof f.used_most === "string") used = f.used_most.trim();
  if (broke) parts.push(`What broke: ${broke}`);
  if (missing) parts.push(`Whats missing: ${missing}`);
  if (used) parts.push(`Used most: ${used}`);
  return parts.length ? parts.join(" | ") : "(no message)";
}

export type EmailRow = {
  id: string;
  from_email: string | null;
  from_name: string | null;
  subject: string | null;
  body: string | null;
  ai_reply: string | null;
  status: string | null;
  received_at: string | null;
  replied_at: string | null;
};
export const EMAIL_COLS = "id,from_email,from_name,subject,body,ai_reply,status,received_at,replied_at";
