"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import type { Segment } from "@/lib/format";
import { isDemoMode } from "@/lib/demo";
import { demoSegmentCounts } from "@/lib/demo-data";
import { Button, Card, ErrorState, Field, Modal, PageHeader, useToast } from "@/components/ui";

const SEGMENTS: { id: Segment; icon: string; title: string; hint: string }[] = [
  { id: "all", icon: "ALL", title: "All users", hint: "Everyone with an email" },
  { id: "free", icon: "FREE", title: "Free / trial", hint: "Not paying, not founding" },
  { id: "paid", icon: "PAID", title: "Paid", hint: "Pro & Family" },
  { id: "founding", icon: "FOUNDING", title: "Founding members", hint: "Founding 200" },
];

async function loadCounts(): Promise<Record<Segment, number>> {
  if (isDemoMode) return demoSegmentCounts;
  const live = () => supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).not("email", "is", null);
  const [all, free, paid, founding] = await Promise.all([
    live(),
    live().eq("subscription_status", "free").not("founding_member", "is", true),
    live().in("subscription_status", ["pro", "family"]).not("founding_member", "is", true),
    live().eq("founding_member", true),
  ]);
  const bad = [all, free, paid, founding].find((r) => r.error);
  if (bad?.error) throw new Error(`profiles: ${bad.error.message}`);
  return { all: all.count ?? 0, free: free.count ?? 0, paid: paid.count ?? 0, founding: founding.count ?? 0 };
}

export default function BroadcastPage() {
  const { data: counts, error, loading, reload } = useLoad(loadCounts);
  const toast = useToast();
  const [segment, setSegment] = useState<Segment>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmN, setConfirmN] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ subject: string; segment: Segment; n: number; at: string }[]>([]);

  const ready = subject.trim() && body.trim();

  async function prepare() {
    setBusy(true);
    try {
      const r = await apiPost<{ recipients: number }>("/api/email/broadcast", { segment, subject, body, dryRun: true });
      if (!r.recipients) toast("No recipients in this segment.", "error");
      else setConfirmN(r.recipients);
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setBusy(false);
  }

  async function send() {
    setBusy(true);
    try {
      const r = await apiPost<{ sent: number; total: number; failedBatches: number; firstError: string | null }>("/api/email/broadcast", { segment, subject, body, confirm: true });
      setSent((s) => [{ subject, segment, n: r.sent, at: new Date().toLocaleTimeString() }, ...s]);
      toast(r.failedBatches ? `Sent ${r.sent}/${r.total}. Some batches failed: ${r.firstError}` : `Broadcast sent to ${r.sent} users.`, r.failedBatches ? "error" : "success");
      setConfirmN(null);
      setSubject("");
      setBody("");
    } catch (e) {
      const err = e as Error & { code?: string };
      toast(err.code === "no_resend_key" ? "Broadcast is stubbed: RESEND_API_KEY is not set in .env.local, so nothing was sent." : err.message, "error");
      setConfirmN(null);
    }
    setBusy(false);
  }

  return (
    <>
      <PageHeader title="Broadcast" subtitle="Email a segment of your users via Resend (sent from the server)" />
      {error && (
        <Card className="mb-6">
          <ErrorState message={error} onRetry={reload} />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSegment(s.id)}
            aria-pressed={segment === s.id}
            className={`glass rounded-3xl p-5 text-left transition hover:-translate-y-0.5 ${segment === s.id ? "ring-2 ring-pk-cyan shadow-[0_0_40px_-10px_rgba(20,200,194,0.7)]" : ""}`}
          >
            <div className="text-sm font-bold tracking-widest text-white/60">{s.icon}</div>
            <div className="mt-2 font-semibold">{s.title}</div>
            <div className="text-xs text-white/45">{s.hint}</div>
            <div className="mt-3 text-sm font-bold text-pk-cyan">{loading && !counts ? "…" : counts ? `${counts[s.id]} users` : "—"}</div>
          </button>
        ))}
      </div>

      <Card className="mt-6 space-y-5 p-6">
        <Field label="Subject">
          <input className="glass-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={300} placeholder="A quick update from PetKira" />
        </Field>
        <Field label="Message (plain text)">
          <textarea className="glass-input" rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi there,&#10;&#10;…" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setPreview(true)} disabled={!ready}>
            Preview
          </Button>
          <Button onClick={prepare} loading={busy && confirmN === null} disabled={!ready}>
            Review & send
          </Button>
        </div>
      </Card>

      {sent.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="mb-3 font-semibold">Sent this session</h2>
          <ul className="space-y-2 text-sm">
            {sent.map((s, i) => (
              <li key={i} className="flex justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5">
                <span className="truncate font-medium">{s.subject}</span>
                <span className="shrink-0 text-white/50">
                  {s.n} recipients · {s.segment} · {s.at}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {preview && (
        <Modal title={`Preview: ${subject || "(no subject)"}`} onClose={() => setPreview(false)} footer={<Button variant="ghost" onClick={() => setPreview(false)}>Close</Button>}>
          <div className="rounded-2xl bg-white p-6 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-900">{body || "(empty)"}</div>
        </Modal>
      )}

      {confirmN !== null && (
        <Modal
          title="Send broadcast?"
          onClose={() => !busy && setConfirmN(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmN(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={send} loading={busy}>
                Send to {confirmN} {confirmN === 1 ? "user" : "users"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-white/75">
            This will send <strong className="text-white">“{subject}”</strong> to <strong className="text-pk-cyan">{confirmN}</strong> {confirmN === 1 ? "recipient" : "recipients"} (demo mode: no email is sent) in the{" "}
            <strong className="text-white">{SEGMENTS.find((s) => s.id === segment)?.title}</strong> segment. Emails cannot be recalled.
          </p>
        </Modal>
      )}
    </>
  );
}
