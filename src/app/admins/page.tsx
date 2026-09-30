"use client";

import { useState, type FormEvent } from "react";
import { adminManage } from "@/lib/adminApi";
import { useAuth } from "@/components/AuthProvider";
import { useLoad } from "@/hooks/useLoad";
import { Button, Card, EmptyState, ErrorState, LoadingRows, PageHeader, useToast } from "@/components/ui";

type Row = Record<string, unknown>;

async function loadAdmins(): Promise<Row[]> {
  const res = await adminManage({ action: "list" });
  return (Array.isArray(res) ? res : (res?.admins ?? res?.data ?? [])) as Row[];
}

const cell = (v: unknown) => (v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));

export default function AdminsPage() {
  const { session } = useAuth();
  const toast = useToast();
  const { data: admins, error, loading, reload } = useLoad(loadAdmins);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function invite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await adminManage({ action: "invite", email: email.trim() });
      const detail = typeof res?.message === "string" ? res.message : `Invited ${email.trim()}.`;
      toast(detail, "success");
      if (typeof res?.invite_link === "string" && res.invite_link) {
        try { await navigator.clipboard.writeText(res.invite_link); toast("Invite/recovery link copied to clipboard.", "success"); } catch { /* ignore */ }
      }
      setEmail("");
      await reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
    setBusy(false);
  }

  async function revoke(a: Row) {
    const aEmail = typeof a.email === "string" ? a.email : undefined;
    const userId = typeof a.user_id === "string" ? a.user_id : typeof a.id === "string" ? a.id : undefined;
    const label = aEmail ?? userId ?? "this admin";
    if (!window.confirm(`Revoke admin access for ${label}?`)) return;
    setBusy(true);
    try {
      await adminManage({ action: "revoke", ...(userId ? { user_id: userId } : { email: aEmail }) });
      toast(`Revoked ${label}.`, "success");
      await reload();
    } catch (err) {
      toast((err as Error).message, "error");
    }
    setBusy(false);
  }

  const cols = admins && admins.length ? Object.keys(admins[0]) : [];

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle="Invite-only. Managed through the admin-manage edge function."
        actions={
          <Button variant="ghost" small onClick={reload} loading={loading}>
            Refresh
          </Button>
        }
      />

      <Card className="p-6">
        <form onSubmit={invite} className="flex flex-wrap gap-3">
          <input type="email" required placeholder="new-admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input max-w-sm flex-1" />
          <Button loading={busy}>Invite admin</Button>
        </form>
      </Card>

      <Card className="mt-6 overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !admins ? (
          <LoadingRows rows={3} />
        ) : !admins?.length ? (
          <EmptyState icon="-" title="No admins returned" />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((a, i) => {
                  const self = typeof a.email === "string" && a.email === session?.user.email;
                  return (
                    <tr key={i}>
                      {cols.map((c) => (
                        <td key={c} className="max-w-xs break-words">
                          {cell(a[c])}
                        </td>
                      ))}
                      <td className="text-right">
                        <Button variant="danger" small disabled={busy || self} onClick={() => revoke(a)} title={self ? "You cannot revoke yourself" : undefined}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

