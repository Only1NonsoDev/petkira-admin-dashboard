"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/config";
import { getSupabase } from "@/lib/supabase";

export type AuthStatus = "loading" | "unconfigured" | "signedOut" | "notAdmin" | "ready";

type AuthContextValue = {
  status: AuthStatus;
  email: string | null;
  userId: string | null;
  message: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const rejectReason = useRef<string | null>(null);
  const runId = useRef(0);
  const finishSignIn = useRef<((message: string | null) => void) | null>(null);

  const clearIdentity = useCallback(() => {
    setEmail(null);
    setUserId(null);
  }, []);

  const settleSignIn = useCallback((nextMessage: string | null) => {
    const finish = finishSignIn.current;
    if (!finish) return;
    finishSignIn.current = null;
    finish(nextMessage);
  }, []);

  const applySession = useCallback(
    async (session: Session | null) => {
      const id = ++runId.current;
      if (!isSupabaseConfigured) {
        setStatus("unconfigured");
        return;
      }

      const supabase = getSupabase();
      if (!session) {
        clearIdentity();
        if (rejectReason.current) {
          setMessage(rejectReason.current);
          setStatus("notAdmin");
          settleSignIn(rejectReason.current);
        } else {
          setMessage(null);
          setStatus("signedOut");
        }
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");
      if (id !== runId.current) return;

      if (error || data !== true) {
        const reason = error
          ? `Could not verify admin access. ${error.message}`
          : "Not an admin account.";
        rejectReason.current = reason;
        clearIdentity();
        setMessage(reason);
        setStatus("notAdmin");
        settleSignIn(reason);
        await supabase.auth.signOut();
        return;
      }

      rejectReason.current = null;
      setEmail(session.user.email ?? null);
      setUserId(session.user.id);
      setMessage(null);
      setStatus("ready");
      settleSignIn(null);
    },
    [clearIdentity, settleSignIn],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer so rpc/signOut are not called inside the auth callback lock.
      setTimeout(() => {
        if (!active) return;
        void applySession(session);
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(
    (nextEmail: string, password: string) => {
      if (!isSupabaseConfigured) return Promise.resolve("Supabase env is not configured.");
      rejectReason.current = null;
      setMessage(null);

      return new Promise<string | null>((resolve) => {
        let settled = false;
        const finish = (nextMessage: string | null) => {
          if (settled) return;
          settled = true;
          finishSignIn.current = null;
          resolve(nextMessage);
        };
        finishSignIn.current = finish;

        void getSupabase()
          .auth.signInWithPassword({
            email: nextEmail.trim(),
            password,
          })
          .then(async ({ data, error }) => {
            if (error) {
              finish(error.message);
              return;
            }
            if (!data.session) {
              finish("Sign in did not return a session.");
              return;
            }
            if (finishSignIn.current) {
              await applySession(data.session);
            }
          })
          .catch((err: unknown) => {
            finish(err instanceof Error ? err.message : "Sign in failed.");
          });
      });
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    rejectReason.current = null;
    setMessage(null);
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, email, userId, message, signIn, signOut }),
    [status, email, userId, message, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
