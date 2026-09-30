"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { LoadingScreen, SetupScreen } from "@/components/status-screens";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "signedOut" || auth.status === "notAdmin") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  if (auth.status === "unconfigured") return <SetupScreen />;
  if (auth.status !== "ready") {
    const label =
      auth.status === "signedOut" || auth.status === "notAdmin"
        ? "Redirecting to sign in…"
        : "Checking admin access…";
    return <LoadingScreen label={label} />;
  }

  return <AppShell>{children}</AppShell>;
}
