"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminManage, type AdminRecord } from "@/lib/admin-api";
import { formatWhen } from "@/lib/format";
import { currentAccessToken } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Alert } from "@/components/status-screens";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminsPanel() {
  const { userId } = useAuth();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [pending, setPending] = useState<AdminRecord | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchAdmins = useCallback(async () => {
    const token = await currentAccessToken();
    const result = await adminManage(token, { action: "list" });
    return result.admins;
  }, []);

  useEffect(() => {
    let active = true;
    void fetchAdmins()
      .then((rows) => {
        if (!active) return;
        setAdmins(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setAdmins([]);
        setError(err instanceof Error ? err.message : "Could not load admins.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAdmins]);

  async function onInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    setNotice(null);
    setInviteLink(null);
    setError(null);
    if (!emailPattern.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setInviting(true);
    try {
      const token = await currentAccessToken();
      const result = await adminManage(token, { action: "invite", email: nextEmail });
      setNotice(result.message ?? `Invited ${result.email ?? nextEmail}.`);
      setInviteLink(result.inviteLink);
      setEmail("");
      setAdmins(await fetchAdmins());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setInviting(false);
    }
  }

  async function confirmRevoke() {
    if (!pending) return;
    setRevoking(true);
    setError(null);
    setNotice(null);
    try {
      const token = await currentAccessToken();
      await adminManage(token, { action: "revoke", user_id: pending.user_id });
      setNotice(`Revoked admin access for ${pending.email ?? pending.user_id}.`);
      setPending(null);
      setAdmins(await fetchAdmins());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed.");
    } finally {
      setRevoking(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice("Invite link copied. Share it only with that person.");
    } catch {
      setError("Could not copy the invite link. Select it and copy it manually.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admins</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Invite-only. Listing, invites, and revokes go through the admin-manage function
          with your access token. Disabled admins fail <code>is_admin()</code>.
        </p>
      </header>

      {error ? <Alert>{error}</Alert> : null}
      {notice ? (
        <p className="rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">{notice}</p>
      ) : null}
      {inviteLink ? (
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-sm text-muted">
            Invite link from the function. It can set a password, so share it only with the invited person.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={inviteLink} className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 font-mono text-xs text-ink" />
            <button type="button" onClick={() => void copyLink()} className="rounded-lg border border-line px-3 py-2 text-sm">
              Copy
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={onInvite} className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1.5 block text-muted">Invite email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-ink outline-none ring-teal focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={inviting}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-canvas hover:bg-teal-dim disabled:opacity-60"
        >
          {inviting ? "Inviting…" : "Invite"}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-panel-2 text-xs uppercase tracking-wide text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Loading admins…
                  </td>
                </tr>
              ) : null}
              {!loading && admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No admin records returned.
                  </td>
                </tr>
              ) : null}
              {admins.map((admin) => {
                const isSelf = admin.user_id === userId;
                const revoked = Boolean(admin.disabled_at);
                return (
                  <tr key={admin.user_id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <div className="font-medium">{admin.email ?? "—"}</div>
                      {isSelf ? <div className="text-xs text-teal">You</div> : null}
                    </td>
                    <td className="px-4 py-3 capitalize">{admin.role}</td>
                    <td className="px-4 py-3">
                      {revoked ? (
                        <span className="text-danger">Revoked {formatWhen(admin.disabled_at)}</span>
                      ) : (
                        <span className="text-ok">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatWhen(admin.created_at)}</td>
                    <td className="px-4 py-3">
                      {revoked ? (
                        <span className="text-xs text-faint">Already revoked</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSelf}
                          title={isSelf ? "You cannot revoke your own admin access" : "Revoke admin access"}
                          onClick={() => setPending(admin)}
                          className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pending ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="revoke-title" className="w-full max-w-md rounded-2xl border border-line bg-panel p-5">
            <h2 id="revoke-title" className="text-lg font-semibold">
              Revoke admin access?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {pending.email ?? pending.user_id} ({pending.role}) will no longer pass the admin
              check. This does not delete their PetKira account.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={revoking}
                onClick={() => setPending(null)}
                className="rounded-lg border border-line px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={() => void confirmRevoke()}
                className="rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {revoking ? "Revoking…" : "Revoke access"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
