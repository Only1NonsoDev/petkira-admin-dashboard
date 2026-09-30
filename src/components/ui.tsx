"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

/* ---------------- Toasts ---------------- */
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };
type ToastApi = (text: string, kind?: ToastKind) => void;

const ToastCtx = createContext<ToastApi>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback<ToastApi>((text, kind = "info") => {
    const id = ++seq.current;
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), kind === "error" ? 7000 : 4200);
  }, []);
  const tone: Record<ToastKind, string> = {
    success: "border-pk-green/40 text-emerald-200",
    error: "border-pk-red/50 text-rose-200",
    info: "border-pk-cyan/40 text-cyan-100",
  };
  const icon: Record<ToastKind, string> = { success: "✓", error: "!", info: "i" };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} role="status" className={`glass-strong pop pointer-events-auto flex gap-3 rounded-2xl border px-4 py-3 text-sm ${tone[t.kind]}`}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{icon[t.kind]}</span>
            <span className="break-words">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`glass-strong pop relative max-h-[90vh] w-full overflow-hidden rounded-3xl ${wide ? "max-w-3xl" : "max-w-xl"} flex flex-col`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-xl leading-none text-white/60 hover:bg-white/10 hover:text-white">
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Primitives ---------------- */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const ACCENTS = {
  teal: "from-pk-teal to-pk-cyan",
  amber: "from-amber-500 to-pk-amber",
  red: "from-rose-500 to-pk-red",
  green: "from-emerald-500 to-pk-green",
  purple: "from-violet-500 to-pk-purple",
} as const;
export type Accent = keyof typeof ACCENTS;

export function StatCard({ label, value, hint, accent = "teal", loading }: { label: string; value: ReactNode; hint?: ReactNode; accent?: Accent; loading?: boolean }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b ${ACCENTS[accent]}`} />
      <div className="pl-2">
        <div className="text-xs font-medium tracking-wide text-white/50 uppercase">{label}</div>
        {loading ? <div className="skeleton mt-2 h-8 w-16" /> : <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>}
        {hint && <div className="mt-1 text-xs text-white/45">{hint}</div>}
      </div>
    </Card>
  );
}

const BADGE_TONES = {
  teal: "bg-pk-teal/15 text-pk-cyan border-pk-teal/40",
  amber: "bg-pk-amber/15 text-amber-300 border-pk-amber/40",
  red: "bg-pk-red/15 text-rose-300 border-pk-red/40",
  green: "bg-pk-green/15 text-emerald-300 border-pk-green/40",
  purple: "bg-pk-purple/15 text-violet-300 border-pk-purple/40",
  gray: "bg-white/8 text-white/65 border-white/15",
} as const;
export type Tone = keyof typeof BADGE_TONES;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${BADGE_TONES[tone]}`}>{children}</span>;
}

export function Button({ variant = "primary", small, loading, children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; small?: boolean; loading?: boolean }) {
  return (
    <button {...rest} disabled={rest.disabled || loading} className={`btn btn-${variant} ${small ? "btn-sm" : ""} ${className}`}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}

export function EmptyState({ icon = "✦", title, text, action }: { icon?: string; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-pk-cyan">{icon}</div>
      <div className="text-base font-semibold">{title}</div>
      {text && <div className="mt-1 max-w-md text-sm text-white/50">{text}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-pk-red/40 bg-pk-red/10 text-xl text-rose-300">!</div>
      <div className="font-semibold text-rose-200">Could not load data</div>
      <div className="mt-1 max-w-lg text-sm break-words text-white/55">{message}</div>
      {onRetry && (
        <Button variant="ghost" small className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-9 w-full" />
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-white/55 uppercase">{label}</span>
      {children}
    </label>
  );
}

/** Vertical bar chart. `values` and `labels` must align. */
export function BarChart({ values, labels, height = 140, unit = "" }: { values: number[]; labels: string[]; height?: number; unit?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {values.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end" title={`${labels[i]}: ${v}${unit}`}>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-pk-teal/70 to-pk-cyan transition-all group-hover:brightness-125"
              style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 1.5)}%`, opacity: v > 0 ? 1 : 0.25 }}
            />
            <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white/80 opacity-0 group-hover:opacity-100">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-white/40">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-pk-teal to-pk-cyan transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return (
    <span className="tracking-tight text-pk-amber" aria-label={`${r} of 5`}>
      {"★".repeat(r)}
      <span className="text-white/20">{"★".repeat(5 - r)}</span>
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input className="glass-input w-full sm:w-64" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function PromptModal({ text, onClose }: { text: string; onClose: () => void }) {
  const toast = useToast();
  const [value, setValue] = useState(text);
  return (
    <Modal
      title="Send to Claude Code"
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={async () => toast((await copyText(value)) ? "Prompt copied to clipboard." : "Clipboard blocked — select the text and copy manually.", "info")}>📋 Copy to clipboard</Button>
        </>
      }
    >
      <textarea className="glass-input font-mono text-xs" rows={16} value={value} onChange={(e) => setValue(e.target.value)} />
    </Modal>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
