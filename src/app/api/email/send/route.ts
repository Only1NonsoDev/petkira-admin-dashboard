import { ApiError, fail, isEmail, readJson, requireAdmin, resendCall, resendFrom } from "@/lib/server-auth";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

const toHtml = (s: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111">${s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")}</div>`;

/** Send a single email (support reply, user shortcut) through Resend. */
export async function POST(req: Request) {
  try {
    if (isDemoMode) return Response.json({ ok: true, id: "demo-email-id" });
    await requireAdmin(req);
    const { to, subject, body } = await readJson<{ to?: unknown; subject?: unknown; body?: unknown }>(req);
    if (!isEmail(to)) throw new ApiError(400, "A valid recipient email is required.");
    if (typeof subject !== "string" || !subject.trim() || subject.length > 300) throw new ApiError(400, "Subject is required (max 300 chars).");
    if (typeof body !== "string" || !body.trim() || body.length > 20000) throw new ApiError(400, "Message body is required.");

    const r = await resendCall("/emails", { from: resendFrom(), to: [to], subject: subject.trim(), text: body, html: toHtml(body) });
    return Response.json({ ok: true, id: r?.id ?? null });
  } catch (e) {
    return fail(e);
  }
}
