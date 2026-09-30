"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost, must } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import { isDemoMode } from "@/lib/demo";
import { demoFeedback } from "@/lib/demo-data";
import { FEEDBACK_COLS, feedbackDisplayText, formatEventName, timeAgo, type FeedbackRow } from "@/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingRows, PageHeader, SearchBox, Stars, StatCard, useToast } from "@/components/ui";

type Analysis = { frustrations: string[]; features: string[]; bugs: string[]; priority: string[] };

async function loadFeedback(): Promise<FeedbackRow[]> {
  if (isDemoMode) return demoFeedback;
  const r = await supabase.from("feedback").select(FEEDBACK_COLS).order("created_at", { ascending: false }).limit(200);
  return must<FeedbackRow[]>(r as never, "feedback");
}

function AiList({ title, items, numbered }: { title: string; items: string[]; numbered?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {items.length ? (
        <ul className="space-y-1.5 text-sm text-white/75">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-pk-cyan">{numbered ? `${i + 1}.` : "-"}</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/40">Nothing notable.</p>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const { data, error, loading, reload } = useLoad(loadFeedback);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [rating, setRating] = useState("all");
  const [ai, setAi] = useState<{ analysis: Analysis; analysed: number } | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const all = data ?? [];
  const avg = all.length ? (all.reduce((s, f) => s + (f.rating ?? 0), 0) / all.length).toFixed(1) : "-";
  const features = all.filter((f) => f.category === "feature_request").length;
  const cats = useMemo(() => [...new Set(all.map((f) => f.category).filter(Boolean))] as string[], [all]);
  const counts = [5, 4, 3, 2, 1].map((r) => all.filter((f) => f.rating === r).length);
  const maxCount = Math.max(1, ...counts);

  const rows = all.filter((f) => {
    const n = q.trim().toLowerCase();
    const hay = `${feedbackDisplayText(f)} ${f.user_email ?? ""} ${f.follow_up_email ?? ""}`.toLowerCase();
    return (cat === "all" || f.category === cat) && (rating === "all" || String(f.rating) === rating) && (!n || hay.includes(n));
  });

  async function analyse() {
    if (!all.length) {
      const msg = "No beta feedback rows yet - Analyse needs at least one entry in the feedback table.";
      setAiErr(msg);
      toast(msg, "error");
      return;
    }
    setAiBusy(true);
    setAiErr(null);
    try {
      setAi(await apiPost("/api/ai/feedback-analysis", {}));
    } catch (e) {
      const msg = (e as Error).message;
      setAiErr(msg);
      toast(msg, "error");
    }
    setAiBusy(false);
  }

  return (
    <>
      <PageHeader
        title="Beta Feedback"
        subtitle="Ratings and comments from beta testers - newest 200"
        actions={
          <>
            <Button variant="ghost" small onClick={reload} loading={loading}>
              Refresh
            </Button>
            <Button onClick={analyse} loading={aiBusy} disabled={!all.length}>
              {ai ? "Re-analyse" : "AI Analyse All Feedback"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Average rating" value={avg} accent="amber" loading={loading && !data} hint={all.length ? "out of 5" : undefined} />
        <StatCard label="Total feedback" value={all.length} accent="teal" loading={loading && !data} />
        <StatCard label="Feature requests" value={features} accent="purple" loading={loading && !data} />
        <Card className="p-5">
          <div className="mb-2 text-xs font-medium tracking-wide text-white/50 uppercase">Rating breakdown</div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((r, i) => (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-white/50">{r}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-pk-amber" style={{ width: `${(counts[i] / maxCount) * 100}%` }} />
                </div>
                <span className="w-5 text-right text-white/60 tabular-nums">{counts[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {(ai || aiErr) && (
        <Card className="mt-6 p-6">
          <h2 className="mb-4 font-semibold">AI analysis {ai && <span className="text-xs font-normal text-white/40">- {ai.analysed} items</span>}</h2>
          {aiErr && <p className="rounded-xl border border-pk-amber/40 bg-pk-amber/10 px-4 py-3 text-sm text-amber-200">{aiErr}</p>}
          {ai && (
            <div className="grid gap-4 md:grid-cols-2">
              <AiList title="Top frustrations" items={ai.analysis.frustrations} />
              <AiList title="Requested features" items={ai.analysis.features} />
              <AiList title="Bugs mentioned" items={ai.analysis.bugs} />
              <AiList title="Suggested priorities" items={ai.analysis.priority} numbered />
            </div>
          )}
        </Card>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-6 py-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search message or email..." />
          <select className="glass-input w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category filter">
            <option value="all">All categories</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {formatEventName(c)}
              </option>
            ))}
          </select>
          <select className="glass-input w-auto" value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Rating filter">
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} stars
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
          <EmptyState icon="?" title={all.length ? "No feedback matches your filters" : "No feedback yet"} text={all.length ? undefined : "Beta tester feedback will appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Category</th>
                  <th>Message</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td className="text-white/70">
                      {f.user_email || "Anonymous"}
                      {f.follow_up_email && f.follow_up_email !== f.user_email && <div className="text-xs text-white/40">{f.follow_up_email}</div>}
                    </td>
                    <td className="whitespace-nowrap">
                      <Stars n={f.rating ?? 0} />
                    </td>
                    <td>
                      <Badge tone={f.category === "feature_request" ? "purple" : f.category === "bug" ? "red" : "teal"}>{formatEventName(f.category || "general")}</Badge>
                    </td>
                    <td className="max-w-md leading-relaxed break-words whitespace-pre-wrap">{feedbackDisplayText(f)}</td>
                    <td className="whitespace-nowrap text-white/40">{timeAgo(f.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
