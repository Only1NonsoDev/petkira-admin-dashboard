"use client";

import { Fragment, useState } from "react";
import { supabase } from "@/lib/supabase";
import { must } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import { isDemoMode } from "@/lib/demo";
import { demoBugs } from "@/lib/demo-data";
import { BUG_COLS, bugPrompt, timeAgo, type BugRow } from "@/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingRows, PageHeader, PromptModal, SearchBox, StatCard, useToast, type Tone } from "@/components/ui";

const STATUSES = ["new", "in_progress", "fixed", "notified"] as const;
const LABEL: Record<string, string> = { new: "New", in_progress: "In progress", fixed: "Fixed", notified: "Notified" };
const TONE: Record<string, Tone> = { new: "red", in_progress: "amber", fixed: "green", notified: "purple" };

async function loadBugs(): Promise<BugRow[]> {
  if (isDemoMode) return demoBugs;
  const r = await supabase.from("bugs").select(BUG_COLS).order("created_at", { ascending: false }).limit(200);
  return must<BugRow[]>(r as never, "bugs");
}

export default function BugsPage() {
  const { data, error, loading, reload, setData } = useLoad(loadBugs);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);

  const all = data ?? [];
  const rows = all.filter((b) => (filter === "all" || b.status === filter) && (!q.trim() || (b.title ?? "").toLowerCase().includes(q.trim().toLowerCase())));

  async function setStatus(b: BugRow, status: string) {
    const prev = b.status;
    const fixedAt = status === "fixed" ? new Date().toISOString() : undefined;
    setData((d) => (d ? d.map((x) => (x.id === b.id ? { ...x, status, ...(fixedAt ? { fixed_at: fixedAt } : {}) } : x)) : d));
    if (isDemoMode) {
      toast(`Marked ${LABEL[status] ?? status}.`, "success");
      return;
    }
    const patch: Record<string, unknown> = { status };
    if (fixedAt) patch.fixed_at = fixedAt;
    const { data: upd, error: err } = await supabase.from("bugs").update(patch).eq("id", b.id).select("id");
    if (err || !upd?.length) {
      setData((d) => (d ? d.map((x) => (x.id === b.id ? { ...x, status: prev } : x)) : d));
      toast(err ? `Status update failed: ${err.message}` : "Status update blocked — RLS does not allow admins to update bugs.", "error");
    } else {
      toast(`Marked ${LABEL[status] ?? status}.`, "success");
    }
  }

  function notify(b: BugRow) {
    toast(`Notify is not wired yet — no user-email mapping exists for bug "${b.title ?? b.id}". Nothing was sent.`, "info");
  }

  return (
    <>
      <PageHeader
        title="Bug Tracker"
        subtitle="Manual bug reports · newest 200"
        actions={
          <Button variant="ghost" small onClick={reload} loading={loading}>
            Refresh
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New" value={all.filter((b) => b.status === "new").length} accent="red" loading={loading && !data} />
        <StatCard label="In progress" value={all.filter((b) => b.status === "in_progress").length} accent="amber" loading={loading && !data} />
        <StatCard label="Fixed" value={all.filter((b) => b.status === "fixed").length} accent="green" loading={loading && !data} />
        <StatCard label="Notified" value={all.filter((b) => b.status === "notified").length} accent="purple" loading={loading && !data} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-6 py-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search title…" />
          <select className="glass-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Status filter">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABEL[s]}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-white/40">{rows.length} shown</span>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingRows />
        ) : !rows.length ? (
          <EmptyState icon="-" title={all.length ? "No bugs match your filters" : "No bugs found"} text={all.length ? undefined : "Nothing has been reported. Enjoy it while it lasts."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bug</th>
                  <th>Status</th>
                  <th>Affected</th>
                  <th>Reported</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <Fragment key={b.id}>
                    <tr className="cursor-pointer" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                      <td className="max-w-md">
                        <div className="font-semibold break-words">{b.title || "(untitled)"}</div>
                        {b.error_message && <div className="mt-1 font-mono text-xs break-words text-rose-300/80">{b.error_message}</div>}
                      </td>
                      <td>
                        <Badge tone={TONE[b.status ?? ""] ?? "gray"}>{LABEL[b.status ?? ""] ?? b.status ?? "—"}</Badge>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="font-semibold text-pk-amber">{b.affected_count ?? 0}</span> users
                      </td>
                      <td className="whitespace-nowrap text-white/40">{timeAgo(b.created_at)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select className="glass-input w-36 py-1.5 text-xs" value={b.status ?? "new"} onChange={(e) => setStatus(b, e.target.value)} aria-label="Change status">
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expanded === b.id && (
                      <tr>
                        <td colSpan={5} className="bg-black/20">
                          <div className="space-y-4 py-2">
                            {b.ai_diagnosis && (
                              <div className="rounded-2xl border border-pk-teal/30 bg-pk-teal/10 p-4 text-sm">
                                <div className="mb-1 text-xs font-semibold tracking-wide text-pk-cyan uppercase">AI diagnosis</div>
                                <span className="whitespace-pre-wrap">{b.ai_diagnosis}</span>
                              </div>
                            )}
                            {b.stack_trace && <pre className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs whitespace-pre-wrap text-white/70">{b.stack_trace}</pre>}
                            <div className="flex flex-wrap gap-2">
                              <Button small onClick={() => setPrompt(bugPrompt(b))}>
                                Send to Claude Code
                              </Button>
                              <Button small variant="ghost" onClick={() => notify(b)}>
                                Notify affected users
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {prompt !== null && <PromptModal text={prompt} onClose={() => setPrompt(null)} />}
    </>
  );
}

