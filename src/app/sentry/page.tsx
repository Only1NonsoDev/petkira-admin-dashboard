"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { must } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import { isDemoMode } from "@/lib/demo";
import { demoSentry } from "@/lib/demo-data";
import { SENTRY_COLS, fmtDate, plainEnglishSentry, safeHttpUrl, sentryDashStatus, sentryPrompt, type DashStatus, type SentryRow } from "@/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingRows, PageHeader, PromptModal, SearchBox, StatCard, type Tone } from "@/components/ui";

const LABEL: Record<DashStatus, string> = { new: "New", in_progress: "In progress", fixed: "Fixed", notified: "Ignored" };
const STATUS_TONE: Record<DashStatus, Tone> = { new: "red", in_progress: "amber", fixed: "green", notified: "gray" };
const LEVEL_TONE: Record<string, Tone> = { fatal: "red", error: "red", warning: "amber", info: "teal" };

// Explicit 10s timeout so an unreachable host shows an error instead of hanging.
async function loadSentry(): Promise<SentryRow[]> {
  if (isDemoMode) return demoSentry;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await supabase.from("sentry_events").select(SENTRY_COLS).order("received_at", { ascending: false }).limit(100).abortSignal(ctrl.signal);
    return must<SentryRow[]>(r as never, "sentry_events");
  } catch (e) {
    if (ctrl.signal.aborted) throw new Error("Request timed out — check your Supabase connection.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export default function SentryPage() {
  const { data, error, loading, reload } = useLoad(loadSentry);
  const [filter, setFilter] = useState<"all" | DashStatus>("all");
  const [q, setQ] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);

  const all = (data ?? []).map((r) => ({ row: r, dash: sentryDashStatus(r) }));
  const count = (s: DashStatus) => all.filter((x) => x.dash === s).length;
  const needle = q.trim().toLowerCase();
  const rows = all.filter((x) => (filter === "all" || x.dash === filter) && (!needle || `${x.row.title ?? ""} ${x.row.culprit ?? ""}`.toLowerCase().includes(needle)));

  return (
    <>
      <PageHeader
        title="Sentry Bugs"
        subtitle="Crash reports from sentry_events · newest 100"
        actions={
          <Button variant="ghost" small onClick={reload} loading={loading}>
            Refresh
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New" value={count("new")} accent="red" loading={loading && !data} />
        <StatCard label="In progress" value={count("in_progress")} accent="amber" loading={loading && !data} />
        <StatCard label="Fixed" value={count("fixed")} accent="green" loading={loading && !data} />
        <StatCard label="Ignored" value={count("notified")} accent="purple" loading={loading && !data} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-6 py-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search title or culprit…" />
          <select className="glass-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Status filter">
            <option value="all">All statuses</option>
            {(Object.keys(LABEL) as DashStatus[]).map((s) => (
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
          <EmptyState icon="-" title={all.length ? "No bugs match this filter" : "No Sentry events yet"} text={all.length ? undefined : "Events arrive via the Sentry webhook into sentry_events."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Severity</th>
                  <th>Events</th>
                  <th>First seen</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ row: b, dash }) => {
                  const link = safeHttpUrl(b.permalink);
                  return (
                    <tr key={b.id}>
                      <td className="max-w-lg">
                        <div className="font-semibold break-words">{b.title || "—"}</div>
                        <div className="mt-1 text-xs leading-relaxed text-white/50">{plainEnglishSentry(b)}</div>
                      </td>
                      <td className="space-y-1">
                        <Badge tone={LEVEL_TONE[b.level ?? ""] ?? "gray"}>{(b.level ?? "?").toUpperCase()}</Badge>
                        <div>
                          <Badge tone={STATUS_TONE[dash]}>{LABEL[dash]}</Badge>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="font-semibold tabular-nums">{Number(b.times_seen) || 0}</div>
                        <div className="text-[11px] text-white/40">events</div>
                      </td>
                      <td className="whitespace-nowrap text-white/60">{fmtDate(b.first_seen)}</td>
                      <td className="space-y-2 text-right whitespace-nowrap">
                        <Button small onClick={() => setPrompt(sentryPrompt(b))}>
                          Claude Code
                        </Button>
                        {link && (
                          <div>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-pk-cyan hover:underline">
                              View in Sentry
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {prompt !== null && <PromptModal text={prompt} onClose={() => setPrompt(null)} />}
    </>
  );
}
