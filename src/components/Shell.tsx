"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { isDemoMode } from "@/lib/demo";

function DemoBadge() {
  return <span className="rounded-full border border-pk-amber/50 bg-pk-amber/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-pk-amber">DEMO</span>;
}

const ICONS: Record<string, string> = {
  health: "M22 12h-4l-3 9L9 3l-3 9H2",
  analytics: "M18 20V10M12 20V4M6 20v-6",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  feedback: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  support: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  bugs: "M8 2l1.9 1.9M16 2l-1.9 1.9M9 7.13v-1a3 3 0 0 1 6 0v1M12 20a6 6 0 0 1-6-6v-3h12v3a6 6 0 0 1-6 6zM12 20v-9M6 13H2M22 13h-4M6 17l-3 1M21 18l-3-1M6 9L3 8M21 8l-3 1",
  sentry: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  broadcast: "M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6",
  admins: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

export const NAV = [
  { href: "/", label: "App Health", icon: "health" },
  { href: "/analytics", label: "User Analytics", icon: "analytics" },
  { href: "/users", label: "Users & Subscribers", icon: "users" },
  { href: "/feedback", label: "Beta Feedback", icon: "feedback" },
  { href: "/support", label: "Support Inbox", icon: "support" },
  { href: "/bugs", label: "Bug Tracker", icon: "bugs" },
  { href: "/sentry", label: "Sentry Bugs", icon: "sentry" },
  { href: "/broadcast", label: "Broadcast", icon: "broadcast" },
  { href: "/admins", label: "Admins", icon: "admins" },
];

function Icon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/petkira-k.png" alt="PetKira" width={size} height={size} className="rounded-xl bg-black object-cover ring-1 ring-pk-cyan/40 shadow-[0_0_24px_-4px_rgba(20,200,194,0.6)]" style={{ width: size, height: size }} />
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { status, session, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (status === "signed_out" && !isLogin) router.replace("/login");
    if (status === "admin" && isLogin) router.replace("/");
  }, [status, isLogin, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (isLogin) return <>{children}</>;
  if (status !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass flex items-center gap-3 rounded-2xl px-5 py-3 text-sm text-white/70">
          <span className="spinner" /> Checking admin session...
        </div>
      </div>
    );
  }

  const current = NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="btn btn-ghost btn-sm">
          Menu
        </button>
        <Logo size={30} />
        <span className="font-semibold">{current?.label ?? "PetKira Admin"}</span>
        {isDemoMode && <DemoBadge />}
      </header>

      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-none border-y-0 border-l-0 p-4 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-2 pt-1 pb-5">
          <Logo />
          <div>
            <div className="text-base leading-tight font-bold">PetKira Admin</div>
            <div className="flex items-center gap-2 text-[11px] tracking-wider text-pk-cyan uppercase">
              Local console
              {isDemoMode && <DemoBadge />}
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = n === current;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-gradient-to-r from-pk-teal/30 to-pk-cyan/10 text-pk-cyan shadow-[inset_0_0_0_1px_rgba(20,200,194,0.35)]" : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon name={n.icon} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2 truncate text-xs text-white/50">
            Signed in as
            {isDemoMode && <DemoBadge />}
          </div>
          <div className="truncate text-sm font-medium" title={session?.user.email}>
            {session?.user.email}
          </div>
          <button onClick={signOut} className="btn btn-ghost btn-sm mt-3 w-full">
            Sign out
          </button>
        </div>
      </aside>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
