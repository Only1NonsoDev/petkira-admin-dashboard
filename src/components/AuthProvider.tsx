"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { envConfigured, supabase } from "@/lib/supabase";
import { DEMO_ADMIN_EMAIL, isDemoMode } from "@/lib/demo";

type Status = "loading" | "signed_out" | "admin";
type Ctx = {
  status: Status;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);
export const NOT_ADMIN = "Not an admin account.";

const DEMO_SESSION = { user: { id: "demo-admin", email: DEMO_ADMIN_EMAIL }, access_token: "demo-token" } as unknown as Session;

async function checkAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setSession(DEMO_SESSION);
      setStatus("admin");
      return;
    }
    if (!envConfigured) {
      setStatus("signed_out");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setStatus("signed_out");
        return;
      }
      if (await checkAdmin()) {
        setSession(data.session);
        setStatus("admin");
      } else {
        await supabase.auth.signOut();
        setSession(null);
        setStatus("signed_out");
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setStatus("signed_out");
      } else if (event === "TOKEN_REFRESHED" && s) {
        setSession(s);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      setSession(DEMO_SESSION);
      setStatus("admin");
      return null;
    }
    if (!envConfigured) return "Missing env: copy .env.example to .env.local and fill in the anon key.";
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return error?.message ?? "Sign-in failed.";
    if (!(await checkAdmin())) {
      await supabase.auth.signOut();
      setSession(null);
      setStatus("signed_out");
      return NOT_ADMIN;
    }
    setSession(data.session);
    setStatus("admin");
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      // Demo stays usable: drop to the login page, where "Enter demo console" signs straight back in.
      setSession(null);
      setStatus("signed_out");
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setStatus("signed_out");
  }, []);

  return <AuthCtx.Provider value={{ status, session, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
