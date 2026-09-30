export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6">
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function SetupScreen() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-5 px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">PetKira Admin</p>
      <h1 className="text-2xl font-semibold tracking-tight">Add the local environment file</h1>
      <p className="text-sm leading-6 text-muted">
        Copy <code className="text-ink">local-admin/.env.example</code> to{" "}
        <code className="text-ink">local-admin/.env.local</code> and set the three public
        client variables. Steps are in <code className="text-ink">LOCAL_RUN.md</code>.
      </p>
      <ul className="space-y-2 rounded-xl border border-line bg-panel p-4 font-mono text-xs text-ink">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        <li>NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL</li>
      </ul>
      <p className="text-sm leading-6 text-muted">
        Use the anon key from the Supabase API settings. Keep service role, OpenAI, and
        Resend secrets out of this app and out of git.
      </p>
    </main>
  );
}

export function Alert({ children }: { children: string }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}
