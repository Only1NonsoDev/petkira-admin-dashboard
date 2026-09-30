import { adminManageUrl, supabaseAnonKey } from "@/lib/config";

export type AdminRecord = {
  user_id: string;
  email: string | null;
  role: string;
  invited_by: string | null;
  created_at: string;
  disabled_at: string | null;
  disabled_by: string | null;
};

export type AdminManageResult = {
  admins: AdminRecord[];
  ok: boolean;
  message: string | null;
  inviteLink: string | null;
  email: string | null;
};

type AdminAction = "list" | "invite" | "revoke";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function parseAdmin(value: unknown): AdminRecord | null {
  const row = asRecord(value);
  if (!row || typeof row.user_id !== "string") return null;
  return {
    user_id: row.user_id,
    email: typeof row.email === "string" ? row.email : null,
    role: typeof row.role === "string" ? row.role : "admin",
    invited_by: typeof row.invited_by === "string" ? row.invited_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    disabled_at: typeof row.disabled_at === "string" ? row.disabled_at : null,
    disabled_by: typeof row.disabled_by === "string" ? row.disabled_by : null,
  };
}

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function adminManage(
  accessToken: string,
  body: { action: AdminAction; email?: string; user_id?: string },
): Promise<AdminManageResult> {
  if (!adminManageUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL is not set.");
  }

  const response = await fetch(adminManageUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const record = asRecord(payload);
  if (!response.ok) {
    const apiError = record && typeof record.error === "string" ? record.error.trim() : "";
    throw new Error(apiError || `Request failed (${response.status})`);
  }

  const admins = Array.isArray(record?.admins)
    ? record.admins.map(parseAdmin).filter((row): row is AdminRecord => row !== null)
    : [];

  return {
    admins,
    ok: record?.ok === true,
    message: typeof record?.message === "string" ? record.message : null,
    inviteLink: safeHttpUrl(record?.invite_link),
    email: typeof record?.email === "string" ? record.email : null,
  };
}
