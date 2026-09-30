# Phase 2 – Cloudflare Access (optional remote access)

Phase 1 runs on `127.0.0.1:3010` only. If you later want to reach it from elsewhere without opening a port, put it behind Cloudflare Tunnel + Cloudflare Access so a second login sits in front of the Supabase login.

## Plan

1. **Deploy target**: keep running `npm run build && npm start` on your own machine (still bound to 127.0.0.1), or deploy to a host of your choice.
2. **Tunnel**: install `cloudflared`, then `cloudflared tunnel login`, `cloudflared tunnel create petkira-admin`.
   Route a hostname (e.g. `admin.yourdomain.com`) to `http://127.0.0.1:3010` in the tunnel config. Nothing is exposed except through the tunnel.
3. **Access application** (Zero Trust dashboard -> Access -> Applications -> Self-hosted):
   - Application domain: `admin.yourdomain.com`
   - Policy: Allow, include only the specific admin emails (or an identity provider group). Add a default Deny.
   - Session duration: short (e.g. 8h). Require MFA at the IdP.
4. **Supabase**: add the new origin to Auth -> URL Configuration if you use redirect flows. Keep RLS and `is_admin` as the real authorization layer.
5. **Verify**: with the tunnel up, an unauthenticated request to the hostname must hit the Cloudflare login, not the app.

## Hardening checklist

- Keep `NEXT_PUBLIC_*` only; no service keys in the app.
- Optionally validate the `Cf-Access-Jwt-Assertion` header in an edge function before honoring `admin-manage`.
- Keep the existing security headers in `next.config.mjs`.
- Do not disable the localhost binding on the origin; the tunnel connects locally.
