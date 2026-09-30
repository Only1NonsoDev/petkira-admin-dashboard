import { functionsUrl, supabase } from "./supabase";
import { isDemoMode } from "./demo";
import { demoAdmins } from "./demo-data";

type Payload =
  | { action: "list" }
  | { action: "invite"; email: string }
  | { action: "revoke"; email?: string; user_id?: string };

// Session-local copy so invite/revoke are visible after reload in demo mode.
let demoList: Record<string, unknown>[] = demoAdmins.map((a) => ({ ...a }));

function demoManage(payload: Payload): unknown {
  if (payload.action === "list") return { admins: demoList };
  if (payload.action === "invite") {
    demoList = [...demoList, { email: payload.email, user_id: `demo-invited-${demoList.length + 1}`, created_at: new Date().toISOString() }];
    return { message: `Demo: invited ${payload.email} (no email was sent).`, invite_link: "https://demo.petkira.local/invite/sample-link" };
  }
  demoList = demoList.filter((a) => a.email !== payload.email && a.user_id !== payload.user_id);
  return { ok: true };
}

export async function adminManage(payload: Payload): Promise<any> {
  if (isDemoMode) return demoManage(payload);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  const res = await fetch(`${functionsUrl}/admin-manage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) throw new Error(body?.error || body?.message || `Request failed (${res.status})`);
  return body;
}
