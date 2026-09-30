"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost, must } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import { isDemoMode } from "@/lib/demo";
import { demoUsers } from "@/lib/demo-data";
import { PROFILE_COLS, fmtDate, mapProfile, type AppUser, type ProfileRow, type UserStatus } from "@/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Field, LoadingRows, Modal, PageHeader, SearchBox, StatCard, useToast, type Tone } from "@/components/ui";

const TONE: Record<UserStatus, Tone> = { trial: "purple", paid: "green", founding: "amber", churned: "red" };
const LABEL: Record<UserStatus, string> = { trial: "Free / trial", paid: "Paid", founding: "Founding", churned: "Churned" };
const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro", family: "Family" };

async function loadUsers(): Promise<AppUser[]> {
  if (isDemoMode) return demoUsers;
  const r = await supabase.from("profiles").select(PROFILE_COLS).is("deleted_at", null).order("created_at", { ascending: false }).limit(500);
  return must<ProfileRow[]>(r as never, "profiles").map(mapProfile);
}

export default function UsersPage() {
  const { data, error, loading, reload } = useLoad(loadUsers);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | UserStatus>("all");
  const [mailTo, setMailTo] = useState<AppUser | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const users = data ?? [];
  const counts = useMemo(
    () => ({
      total: users.length,
      trial: users.filter((u) => u.status === "trial").length,
      paid: users.filter((u) => u.status === "paid").length,
      founding: users.filter((u) => u.is_founding).length,
    }),
    [users],
  );
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => (filter === "all" || u.status === filter) && (!needle || u.email.toLowerCase().includes(needle)));
  }, [users, q, filter]);

  function openMail(u: AppUser) {
    setMailTo(u);
    setSubject("");
    setBody("");
  }

  async function send() {
    if (!mailTo) return;
    setSending(true);
    try {
      await apiPost("/api/email/send", { to: mailTo.email, subject, body });
      toast(`Email sent to ${mailTo.email}.`, "success");
      setMailTo(null);
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setSending(false);
  }

  return (
    <>
      <PageHeader
        title="Users & Subscribers"
        subtitle={`From the profiles table · newest 500${users.length >= 500 ? " (limit reached)" : ""}`}
        actions={
          <Button variant="ghost" small onClick={reload} loading={loading}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Loaded users" value={counts.total} accent="teal" loading={loading && !data} />
        <StatCard label="Free / trial" value={counts.trial} accent="purple" loading={loading && !data} />
        <StatCard label="Paid" value={counts.paid} accent="green" loading={loading && !data} />
        <StatCard label="Founding" value={counts.founding} accent="amber" loading={loading && !data} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-6 py-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search email…" />
          <select className="glass-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Status filter">
            <option value="all">All statuses</option>
            <option value="trial">Free / trial</option>
            <option value="paid">Paid</option>
            <option value="founding">Founding</option>
          </select>
          <span className="ml-auto text-xs text-white/40">{rows.length} shown</span>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !rows.length ? (
          <EmptyState icon="-" title={users.length ? "No users match your filters" : "No users yet"} text={users.length ? "Try clearing the search or status filter." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.email || <span className="text-white/30">(no email)</span>}</td>
                    <td>
                      <Badge tone={TONE[u.status]}>{LABEL[u.status]}</Badge>
                    </td>
                    <td className="text-white/60">{PLAN_LABEL[u.plan] ?? u.plan}</td>
                    <td className="whitespace-nowrap text-white/60">{fmtDate(u.created_at)}</td>
                    <td className="text-right">
                      <Button variant="ghost" small disabled={!u.email} onClick={() => openMail(u)}>
                        Email
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {mailTo && (
        <Modal
          title={`Email ${mailTo.email}`}
          onClose={() => setMailTo(null)}
          footer={
            <>
              <a
                className="btn btn-ghost"
                href={`mailto:${encodeURIComponent(mailTo.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              >
                Open in mail app
              </a>
              <Button variant="ghost" onClick={() => setMailTo(null)}>
                Cancel
              </Button>
              <Button onClick={send} loading={sending} disabled={!subject.trim() || !body.trim()}>
                {isDemoMode ? "Send (demo)" : "Send via Resend"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Subject">
              <input className="glass-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={300} />
            </Field>
            <Field label="Message">
              <textarea className="glass-input" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
