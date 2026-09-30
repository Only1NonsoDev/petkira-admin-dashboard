"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase";
import { TABLE_VIEWS } from "@/lib/views";

type CountState = { count: number | null; error: string | null };

const links = [
  ...Object.values(TABLE_VIEWS).map((view) => ({
    href: view.href,
    label: view.title,
    table: view.table,
    description: view.description,
  })),
  {
    href: "/admins",
    label: "Admins",
    table: null,
    description: "Invite an admin by email, or revoke access. You cannot revoke yourself.",
  },
];

export function Dashboard() {
  const { email } = useAuth();
  const [counts, setCounts] = useState<Record<string, CountState>>({});

  useEffect(() => {
    let active = true;
    const tables = Object.values(TABLE_VIEWS).map((view) => view.table);

    void Promise.all(
      tables.map(async (table) => {
        const { count, error } = await getSupabase()
          .from(table)
          .select("*", { count: "exact", head: true });
        return [table, { count: count ?? null, error: error?.message ?? null }] as const;
      }),
    ).then((entries) => {
      if (!active) return;
      setCounts(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">PetKira operations</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Signed in as {email ?? "an admin"}. Product tables are read-only here. Admin
          invites and revokes go through the Admins page.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => {
          const count = link.table ? counts[link.table] : undefined;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-line bg-panel p-5 transition hover:border-teal/50"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold">{link.label}</h2>
                <span className="font-mono text-lg text-teal">
                  {link.table ? (count?.error ? "—" : count ? count.count ?? "—" : "…") : "→"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{link.description}</p>
              {count?.error ? <p className="mt-2 text-xs text-danger">{count.error}</p> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
