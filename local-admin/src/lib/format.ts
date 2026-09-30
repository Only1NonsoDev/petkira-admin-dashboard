export type DbRow = Record<string, unknown>;

export function formatWhen(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

export function formatDetail(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return truncate(value, 4000);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return truncate(JSON.stringify(value, null, 2), 4000);
  } catch {
    return "—";
  }
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export function rowKey(row: DbRow, index: number): string {
  const id = row.id ?? row.user_id;
  if (typeof id === "string" || typeof id === "number") return String(id);
  return `row-${index}`;
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
