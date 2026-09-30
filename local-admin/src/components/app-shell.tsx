"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { NAV_ITEMS } from "@/lib/views";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-teal/15 text-teal" : "text-muted hover:bg-white/5 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { email, signOut } = useAuth();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-panel md:flex">
        <div className="border-b border-line px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal text-sm font-bold text-canvas">
              P
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">PetKira</p>
              <p className="text-xs text-teal">Local admin</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavLinks />
        </nav>
        <div className="border-t border-line px-4 py-4">
          <p className="truncate text-xs text-muted" title={email ?? undefined}>
            {email ?? "Signed in"}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-panel/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold">PetKira Admin</p>
            <button type="button" onClick={() => void signOut()} className="text-sm text-teal">
              Sign out
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
            <NavLinks />
          </nav>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}
