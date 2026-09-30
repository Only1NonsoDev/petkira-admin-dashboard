/** Portfolio demo switch. When true the app runs on invented sample data and never touches Supabase/OpenAI/Resend. */
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_ADMIN_EMAIL = "demo@petkira.local";

/** ISO timestamp `n` days before now (fractions allowed) for sample data. */
export function makeIsoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}
