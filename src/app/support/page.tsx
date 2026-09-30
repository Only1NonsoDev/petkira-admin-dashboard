"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost, must } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import { isDemoMode } from "@/lib/demo";
import { demoEmails } from "@/lib/demo-data";
import { EMAIL_COLS, fmtDateTime, timeAgo, type EmailRow } from "@/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingRows, PageHeader, useToast } from "@/components/ui";

async function loadEmails(): Promise<EmailRow[]> {
  if (isDemoMode) return demoEmails;
  const r = await supabase.from("support_emails").select(EMAIL_COLS).order("received_at", { ascending: false }).limit(200);
  return must<EmailRow[]>(r as never, "support_emails");
}

export default function SupportPage() {
  const { data, error, loading, reload, setData } = useLoad(loadEmails);
  const toast = useToast();
  const [tab, setTab] = useState<"open" | "archived">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  const all = data ?? [];
  const list = all.filter((e) => (tab === "archived" ? e.status === "archived" : e.status !== "archived"));
  const current = all.find((e) => e.id === openId) ?? null;
  const unread = all.filter((e) => e.status === "unread").length;

  useEffect(() => {
    setDraft(current?.ai_reply ?? "");
    // only reset when a different email is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const patchLocal = (id: string, patch: Partial<EmailRow>) => setData((d) => (d ? d.map((e) => (e.id === id ? { ...e, ...patch } : e)) : d));

  /** Update under RLS; `.select()` reveals when zero rows were affected (policy blocked it). */
  async function update(id: string, patch: Partial<EmailRow>): Promise<string | null> {
    if (isDemoMode) return null; // demo: local state only (patchLocal handles the UI)
    const { data: rows, error: err } = await supabase.from("support_emails").update(patch).eq("id", id).select("id");
    if (err) return err.message;
    if (!rows?.length) return "No rows updated — RLS does not allow admins to update support_emails.";
    return null;
  }

  async function open(e: EmailRow) {
    setOpenId(e.id);
    if (e.status === "unread") {
      patchLocal(e.id, { status: "read" });
      const err = await update(e.id, { status: "read" });
      if (err) {
        patchLocal(e.id, { status: "unread" });
        toast(`Couldn't mark as read: ${err}`, "error");
      }
    }
  }

  async function aiDraft() {
    if (!current) return;
    setDrafting(true);
    try {
      const r = await apiPost<{ reply: string }>("/api/ai/support-draft", { emailId: current.id });
      setDraft(r.reply);
      toast("AI draft ready — review before sending.", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setDrafting(false);
  }

  async function send() {
    if (!current || !current.from_email) return;
    if (!draft.trim()) return toast("Reply is empty.", "error");
    setSending(true);
    try {
      const subject = /^re:/i.test(current.subject ?? "") ? current.subject! : `Re: ${current.subject ?? "your message"}`;
      await apiPost("/api/email/send", { to: current.from_email, subject, body: draft });
      const now = new Date().toISOString();
      const err = await update(current.id, { status: "replied", replied_at: now, ai_reply: draft });
      if (err) {
        toast(`Email sent, but the inbox row could not be updated: ${err}`, "info");
      } else {
        patchLocal(current.id, { status: "replied", replied_at: now, ai_reply: draft });
        toast(`Reply sent to ${current.from_email}.`, "success");
      }
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setSending(false);
  }

  async function archive() {
    if (!current) return;
    const err = await update(current.id, { status: "archived" });
    if (err) return toast(`Could not archive: ${err}`, "error");
    patchLocal(current.id, { status: "archived" });
    setOpenId(null);
    toast("Archived.", "success");
  }

  const tone = (s: string | null) => (s === "unread" ? "amber" : s === "replied" ? "green" : "gray");

  return (
    <>
      <PageHeader
        title="Support Inbox"
        subtitle={`${unread} unread · newest 200`}
        actions={
          <Button variant="ghost" small onClick={reload} loading={loading}>
            Refresh
          </Button>
        }
      />
      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <Card className="overflow-hidden lg:max-h-[75vh] lg:overflow-y-auto">
            <div className="sticky top-0 z-10 flex gap-2 border-b border-white/10 bg-[#0a1220]/70 px-4 py-3 backdrop-blur-xl">
              {(["open", "archived"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`}>
                  {t === "open" ? "Inbox" : "Archived"}
                </button>
              ))}
            </div>
            {loading && !data ? (
              <LoadingRows />
            ) : !list.length ? (
              <EmptyState icon="-" title={tab === "open" ? "Inbox zero" : "Nothing archived"} text={tab === "open" ? "No support emails yet." : undefined} />
            ) : (
              list.map((e) => (
                <button
                  key={e.id}
                  onClick={() => open(e)}
                  className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${openId === e.id ? "bg-pk-teal/15" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${e.status === "unread" ? "font-bold" : "font-medium text-white/80"}`}>{e.from_name || e.from_email || "Unknown"}</span>
                    <span className="shrink-0 text-[11px] text-white/40">{timeAgo(e.received_at)}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-white/55">{e.subject || "(no subject)"}</div>
                  {e.status === "unread" && <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-pk-cyan" />}
                </button>
              ))
            )}
          </Card>

          <Card className="min-h-[24rem] p-6">
            {!current ? (
              <EmptyState icon="-" title="Select an email to read" text="Open a message on the left to view it, draft an AI reply and send it." />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold break-words">{current.subject || "(no subject)"}</h2>
                    <Badge tone={tone(current.status)}>{current.status ?? "—"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/55">
                    From <span className="text-white/80">{current.from_name ? `${current.from_name} <${current.from_email}>` : current.from_email}</span> · {fmtDateTime(current.received_at)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap">{current.body || "(empty message)"}</div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium tracking-wide text-white/55 uppercase">Reply</span>
                    <Button variant="ghost" small onClick={aiDraft} loading={drafting}>
                      Draft with AI
                    </Button>
                  </div>
                  <textarea className="glass-input" rows={9} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a reply, or draft one with AI…" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={send} loading={sending} disabled={!current.from_email || !draft.trim()}>
                    Send reply
                  </Button>
                  {current.status !== "archived" && (
                    <Button variant="ghost" onClick={archive}>
                      Archive
                    </Button>
                  )}
                </div>
                {current.replied_at && <p className="text-xs text-white/40">Replied {fmtDateTime(current.replied_at)}</p>}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
