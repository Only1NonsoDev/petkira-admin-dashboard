"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { must } from "@/lib/api";
import { useLoad } from "@/hooks/useLoad";
import { timeAgo } from "@/lib/format";
import { isDemoMode } from "@/lib/demo";
import { demoHealth } from "@/lib/demo-data";
import { BarChart, Card, EmptyState, ErrorState, PageHeader, ProgressBar, StatCard, Button, LoadingRows } from "@/components/ui";

const FOUNDING_CAP = 200;

async function headCount(label: string, q: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await q;
  if (error) throw new Error(`${label}: ${error.message}`);
  return count ?? 0;
}

async function loadHealth() {
  if (isDemoMode) return demoHealth();
  const weekAgo = new Date();
  weekAgo.setHours(0, 0, 0, 0);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const live = () => supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null);
  const [total, trials, founding, openBugs, unread, week, recentUsers, recentBugs, recentMail] = await Promise.all([
    headCount("profiles", live()),
    headCount("profiles", live().or("subscription_status.eq.free,subscription_status.is.null").not("founding_member", "is", true)),
    headCount("profiles", live().eq("founding_member", true)),
    headCount("bugs", supabase.from("bugs").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"])),
    headCount("support_emails", supabase.from("support_emails").select("id", { count: "exact", head: true }).eq("status", "unread")),
    supabase.from("profiles").select("created_at").is("deleted_at", null).gte("created_at", weekAgo.toISOString()).order("created_at", { ascending: false }).limit(1000),
    supabase.from("profiles").select("email,created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(4),
    supabase.from("bugs").select("title,created_at").eq("status", "new").order("created_at", { ascending: false }).limit(3),
    supabase.from("support_emails").select("from_email,subject,received_at").eq("status", "unread").order("received_at", { ascending: false }).limit(3),
  ]);

  // Real signups per day from profiles.created_at
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    return { key: key(d), label: d.toLocaleDateString("en-GB", { weekday: "short" }), n: 0 };
  });
  for (const r of must(week, "profiles (week)") as { created_at: string }[]) {
    const b = buckets.find((x) => x.key === key(new Date(r.created_at)));
    if (b) b.n++;
  }

  const users = must(recentUsers, "profiles (recent)") as { email: string | null; created_at: string }[];
  const bugs = must(recentBugs, "bugs (recent)") as { title: string | null; created_at: string }[];
  const mail = must(recentMail, "support_emails (recent)") as { from_email: string | null; subject: string | null; received_at: string }[];
  const activity = [
    ...users.map((u) => ({ icon: "+", event: "New signup", detail: u.email ?? "(no email)", time: u.created_at })),
    ...bugs.map((b) => ({ icon: "!", event: "New bug reported", detail: b.title ?? "(untitled)", time: b.created_at })),
    ...mail.map((m) => ({ icon: "@", event: "Support email", detail: `${m.from_email ?? "?"} - ${m.subject ?? ""}`, time: m.received_at })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return { total, trials, paid: total - trials, founding, openBugs, unread, weekLabels: buckets.map((b) => b.label), weekValues: buckets.map((b) => b.n), activity };
}

export default function HealthPage() {
  const { data, error, loading, reload } = useLoad(loadHealth);
  const d = data;
  const weekTotal = d ? d.weekValues.reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <PageHeader
        title="App Health"
        subtitle={isDemoMode ? "Invented sample data - no live services connected" : "Live numbers from your Supabase project"}
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={d?.total} loading={loading && !d} accent="teal" />
        <StatCard label="Trials / free" value={d?.trials} loading={loading && !d} accent="purple" />
        <StatCard label="Paid" value={d?.paid} loading={loading && !d} accent="green" hint="Pro, Family & Founding" />
        <StatCard label="Open bugs" value={d?.openBugs} loading={loading && !d} accent="red" hint="New + in progress" />
        <StatCard label="Founding" value={d?.founding} loading={loading && !d} accent="amber" hint={d ? `${Math.max(0, FOUNDING_CAP - d.founding)} left` : undefined} />
        <StatCard label="Open support" value={d?.unread} loading={loading && !d} accent="teal" hint="Unread emails" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Founding members</h2>
            <span className="text-sm text-white/50">{d ? `${d.founding} / ${FOUNDING_CAP}` : "—"}</span>
          </div>
          <div className="mt-4">
            <ProgressBar pct={d ? (d.founding / FOUNDING_CAP) * 100 : 0} />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-pk-cyan">{d?.founding ?? "—"} claimed</span>
            <span className="text-white/50">{d ? Math.max(0, FOUNDING_CAP - d.founding) : "—"} remaining</span>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">Signups this week</h2>
            <span className="text-sm text-white/50">{d ? `${weekTotal} new ${weekTotal === 1 ? "signup" : "signups"}` : "—"}</span>
          </div>
          {d ? <BarChart values={d.weekValues} labels={d.weekLabels} height={110} unit=" signups" /> : <div className="skeleton h-32 w-full" />}
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-semibold">Recent activity</h2>
          <div className="flex gap-3 text-xs text-white/50">
            <Link href="/users" className="hover:text-pk-cyan">Users →</Link>
            <Link href="/bugs" className="hover:text-pk-cyan">Bugs →</Link>
            <Link href="/support" className="hover:text-pk-cyan">Inbox →</Link>
          </div>
        </div>
        {loading && !d ? (
          <LoadingRows rows={4} />
        ) : d && d.activity.length ? (
          <table className="tbl">
            <tbody>
              {d.activity.map((a, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap">
                    <span className="mr-2 inline-block w-4 text-center font-bold text-pk-cyan">{a.icon}</span>
                    {a.event}
                  </td>
                  <td className="max-w-[28rem] truncate text-white/60">{a.detail}</td>
                  <td className="text-right whitespace-nowrap text-white/40">{timeAgo(a.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !error && <EmptyState icon="-" title="No recent activity" text="New signups, bugs and support emails will show up here." />
        )}
      </Card>
    </>
  );
}
