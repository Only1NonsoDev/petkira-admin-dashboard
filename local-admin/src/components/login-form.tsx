"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Alert, LoadingScreen, SetupScreen } from "@/components/status-screens";

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.status === "ready") router.replace("/");
  }, [auth.status, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const error = await auth.signIn(email, password);
    if (error) {
      setFormError(error);
      setSubmitting(false);
    }
  }

  if (auth.status === "unconfigured") return <SetupScreen />;
  if (auth.status === "loading" || auth.status === "ready") {
    return <LoadingScreen label={auth.status === "ready" ? "Opening dashboard…" : "Checking session…"} />;
  }

  const notice = formError ?? (auth.status === "notAdmin" ? auth.message : null);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-line bg-panel p-6 shadow-xl shadow-black/30">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-base font-bold text-canvas">
            P
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">Local only</p>
            <h1 className="text-xl font-semibold tracking-tight">PetKira Admin</h1>
          </div>
        </div>
        <p className="mb-5 text-sm leading-6 text-muted">
          Sign in with the account an owner invited. This app has no public signup.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          {notice ? <Alert>{notice}</Alert> : null}
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-ink outline-none ring-teal focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-ink outline-none ring-teal focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-teal-dim disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
