"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { data: T | null; error: string | null; loading: boolean };

/** Runs `fn` on mount and whenever `reload()` is called. Errors are surfaced, never swallowed. */
export function useLoad<T>(fn: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (e) {
      if (alive.current) setState((s) => ({ data: s.data, error: e instanceof Error ? e.message : String(e), loading: false }));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);

  const setData = useCallback((updater: (d: T | null) => T | null) => setState((s) => ({ ...s, data: updater(s.data) })), []);
  return { ...state, reload, setData };
}
