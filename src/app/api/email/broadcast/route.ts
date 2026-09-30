import { ApiError, fail, isEmail, readJson, requireAdmin, resendCall, resendFrom } from "@/lib/server-auth";
import { isDemoMode } from "@/lib/demo";
import { demoSegmentCount } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type Seg = "all" | "free" | "paid" | "founding";
const SEGS: Seg[] = ["all", "free", "paid", "founding"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

/**
 * Broadcast to a profile segment. Recipients are resolved server-side from `profiles`
 * (under the admin's RLS) — the client only chooses a segment. `dryRun` returns the count only;
 * a real send requires `confirm: true`.
 */
export async function POST(req: Request) {
  try {
    if (isDemoMode) {
      const d = await readJson<{ segment?: string; dryRun?: boolean }>(req);
      const n = demoSegmentCount(SEGS.includes(d.segment as Seg) ? (d.segment as Seg) : "all");
      return Response.json(d.dryRun ? { recipients: n } : { ok: true, sent: n, total: n, failedBatches: 0, firstError: null });
    }
    const { db } = await requireAdmin(req);
    const b = await readJson<{ segment?: string; subject?: unknown; body?: unknown; dryRun?: boolean; confirm?: boolean }>(req);
    const segment = b.segment as Seg;
    if (!SEGS.includes(segment)) throw new ApiError(400, "Unknown segment.");
    if (typeof b.subject !== "string" || !b.subject.trim() || b.subject.length > 300) throw new ApiError(400, "Subject is required.");
    if (typeof b.body !== "string" || !b.body.trim() || b.body.length > 20000) throw new ApiError(400, "Message is required.");

    // Loosely typed: the chained builder types get excessively deep otherwise.
    let q: any = db.from("profiles").select("email,subscription_status,founding_member").is("deleted_at", null).not("email", "is", null).limit(5000);
    if (segment === "free") q = q.eq("subscription_status", "free").not("founding_member", "is", true);
    if (segment === "paid") q = q.in("subscription_status", ["pro", "family"]).not("founding_member", "is", true);
    if (segment === "founding") q = q.eq("founding_member", true);
    const { data, error } = await q;
    if (error) throw new ApiError(502, `Could not resolve recipients: ${error.message}`);

    const emails = [...new Set(((data ?? []) as { email: string }[]).map((r) => r.email.trim().toLowerCase()).filter(isEmail))];
    if (!process.env.RESEND_API_KEY) throw new ApiError(503, "RESEND_API_KEY is not set in .env.local — broadcast is stubbed and nothing was sent.", "no_resend_key");
    if (b.dryRun) return Response.json({ recipients: emails.length });
    if (!b.confirm) throw new ApiError(400, "Broadcast requires explicit confirmation.");
    if (!emails.length) throw new ApiError(422, "No recipients in this segment.");

    const from = resendFrom();
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111">${esc(b.body)}</div>`;
    let sent = 0;
    const failures: string[] = [];
    for (let i = 0; i < emails.length; i += 100) {
      const chunk = emails.slice(i, i + 100);
      try {
        // One message per recipient so addresses are never exposed to each other.
        await resendCall("/emails/batch", chunk.map((to) => ({ from, to: [to], subject: b.subject as string, text: b.body as string, html })));
        sent += chunk.length;
      } catch (e) {
        failures.push(e instanceof Error ? e.message : "batch failed");
      }
    }
    if (!sent) throw new ApiError(502, failures[0] ?? "Send failed.");
    return Response.json({ ok: true, sent, total: emails.length, failedBatches: failures.length, firstError: failures[0] ?? null });
  } catch (e) {
    return fail(e);
  }
}
