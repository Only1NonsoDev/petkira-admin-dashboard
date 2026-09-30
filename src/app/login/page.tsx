"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/Shell";
import { Button, Field } from "@/components/ui";
import { DEMO_ADMIN_EMAIL, isDemoMode } from "@/lib/demo";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    if (err) {
      setError(err);
      setPassword("");
    }
    setBusy(false);
  }

  if (isDemoMode) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-strong pop w-full max-w-sm space-y-5 rounded-3xl p-8">
          <div className="flex flex-col items-center text-center">
            <Logo size={72} />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">PetKira Admin</h1>
            <span className="mt-2 rounded-full border border-pk-amber/50 bg-pk-amber/15 px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-pk-amber">DEMO</span>
            <p className="mt-3 text-sm text-white/50">Portfolio demo with invented sample data. No password needed.</p>
            <p className="mt-1 text-xs text-white/35">Signs in as {DEMO_ADMIN_EMAIL}</p>
          </div>
          <Button
            className="w-full"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await signIn(DEMO_ADMIN_EMAIL, "");
              setBusy(false);
            }}
          >
            Enter demo console
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="glass-strong pop w-full max-w-sm space-y-5 rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <Logo size={72} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">PetKira Admin</h1>
          <p className="mt-1 text-sm text-white/50">Invite-only · local access</p>
        </div>
        <Field label="Email">
          <input type="email" required autoComplete="username" placeholder="you@petkira.com" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" />
        </Field>
        <Field label="Password">
          <input type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input" />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl border border-pk-red/40 bg-pk-red/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <Button loading={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
