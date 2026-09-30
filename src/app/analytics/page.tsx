"use client";

import { supabase } from "@/lib/supabase";
import { useLoad } from "@/hooks/useLoad";
import { isDemoMode } from "@/lib/demo";
import { demoActivitySummary, demoDau, demoEvents, demoFeaturePopularity } from "@/lib/demo-data";
import { formatEventName, fmtDateTime, num } from "@/lib/format";
import { BarChart, Button, Card, EmptyState, ErrorState, LoadingRows, PageHeader, StatCard } from "@/components/ui";

type Part<T> = { ok: true; data: T } | { ok: false; error: string };
async function part<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<Part<T>> {
  const { data, error } = await p;
  return error ? { ok: false, error: error.message } : { ok: true, data: (data ?? null) as T };
}

async function loadAnalytics() {
  if (isDemoMode) {
    const ok = <T,>(data: T): Part<T> => ({ ok: true, data });
    return { stats: ok<Row | null>(demoActivitySummary), dau: ok<Row[]>(demoDau), features: ok<Row[]>(demoFeaturePopularity), events: ok<Row[]>(demoEvents) };
  }
  const [stats, dau, features, events] = await Promise.all([
    part(supabase.from("user_events_activity_summary").select("*").maybeSingle()),
    part(supabase.from("daily_active_users").select("*").order("day", { ascending: false }).limit(14)),
    part(supabase.from("feature_popularity").select("*").order("total_uses", { ascending: false }).limit(10)),
    part(supabase.from("user_events").select("event_name, event_category, screen_name, platform, created_at").order("created_at", { ascending: false }).limit(25)),
  ]);
  return { stats, dau, features, events };
}

type Row = Record<string, any>;

function Section({ title, part, empty, children, pad = true }: { title: string; part: Part<Row[]>; empty: string; children: (rows: Row[]) => React.ReactNode; pad?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4 font-semibold">{title}</div>
      {!part.ok ? (
        <ErrorState message={part.error} />
      ) : !part.data?.length ? (
        <EmptyState icon="-" title={empty} />
      ) : (
        <div className={pad ? "p-6" : ""}>{children(part.data)}</div>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, error, loading, reload } = useLoad(loadAnalytics);
  const s = data?.stats.ok ? (data.stats.data as Row | null) : null;
  const statsErr = data && !data.stats.ok ? data.stats.error : null;
  const dash = statsErr ? "—" : undefined;

  const features = data?.features.ok ? (data.features.data as Row[] | null) : null;
  const top = features?.[0];

  return (
    <>
      <PageHeader
        title="User Analytics"
        subtitle="Daily active users, feature usage and the latest app events"
        actions={
          <Button variant="ghost" small onClick={reload} loading={loading}>
            Refresh
          </Button>
        }
      />
      {error && (
        <Card className="mb-6">
          <ErrorState message={error} onRetry={reload} />
        </Card>
      )}
      {statsErr && <p className="mb-4 rounded-xl border border-pk-red/40 bg-pk-red/10 px-4 py-2 text-sm text-rose-200">Stats: {statsErr}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active today (DAU)" value={dash ?? num(s?.users_today)} loading={loading && !data} accent="teal" />
        <StatCard label="Active 7 days (WAU)" value={dash ?? num(s?.users_7d)} loading={loading && !data} accent="purple" />
        <StatCard label="Events today" value={dash ?? num(s?.events_today)} loading={loading && !data} accent="green" />
        <StatCard
          label="Top feature"
          value={<span className="text-xl">{top ? formatEventName(top.event_name) : "—"}</span>}
          hint={top ? `${num(top.total_uses)} uses` : undefined}
          loading={loading && !data}
          accent="amber"
        />
      </div>

      {loading && !data ? (
        <Card className="mt-6">
          <LoadingRows />
        </Card>
      ) : (
        data && (
          <div className="mt-6 space-y-6">
            <Section title="Daily active users — last 14 days" part={data.dau as Part<Row[]>} empty="No activity data yet">
              {(rows) => {
                const r = [...rows].reverse();
                return (
                  <BarChart
                    values={r.map((x) => num(x.active_users))}
                    labels={r.map((x) => {
                      const [, m, d] = String(x.day).split("-");
                      return `${num(m)}/${num(d)}`;
                    })}
                    unit=" users"
                  />
                );
              }}
            </Section>

            <Section title="Feature popularity" part={data.features as Part<Row[]>} empty="No feature events yet" pad={false}>
              {(rows) => {
                const max = Math.max(...rows.map((r) => num(r.total_uses)), 1);
                return (
                  <div className="overflow-x-auto">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Feature</th>
                          <th>Total uses</th>
                          <th>Unique users</th>
                          <th className="w-1/3">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td className="font-medium">{formatEventName(r.event_name)}</td>
                            <td className="tabular-nums">{num(r.total_uses)}</td>
                            <td className="tabular-nums">{num(r.unique_users)}</td>
                            <td>
                              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-gradient-to-r from-pk-teal to-pk-cyan" style={{ width: `${(num(r.total_uses) / max) * 100}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }}
            </Section>

            <Section title="Recent events" part={data.events as Part<Row[]>} empty="No events logged yet" pad={false}>
              {(rows) => (
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Category</th>
                        <th>Screen</th>
                        <th>Platform</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap text-white/60">{fmtDateTime(e.created_at)}</td>
                          <td className="font-medium">{formatEventName(e.event_name)}</td>
                          <td>{String(e.event_category ?? "—")}</td>
                          <td>{String(e.screen_name || "—")}</td>
                          <td>{String(e.platform || "—")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        )
      )}
    </>
  );
}
