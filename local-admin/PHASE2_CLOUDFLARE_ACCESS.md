# Phase 2 — Cloudflare Access and Tunnel

The app in this folder binds to `127.0.0.1`. That is the whole hosting story for now. This note is the later plan for reaching it off the laptop without putting the Next.js app on a public host.

## Keep the app local

- Continue to start it with `next dev -H 127.0.0.1` or `next start -H 127.0.0.1` (`npm run dev` / `npm start`).
- Point a Cloudflare Tunnel (`cloudflared`) at `http://127.0.0.1:3000`.
- Put a Cloudflare Access application on the tunnel hostname.
- Allow only the admin email identities that should even see the login page.

Access is an extra gate in front of the site. It does not replace Supabase Auth, `is_admin()`, or row level security. Someone who passes Access still signs in with an invited admin account, and a disabled admin still fails `is_admin()`.

## Secrets stay where they are

- The Next app still uses only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`.
- Service role, OpenAI, and Resend secrets stay in Supabase and the edge function environment.
- Tunnel credentials and Access service tokens stay in the Cloudflare dashboard or a local cloudflared config that is not committed.

## Still not a public deploy

Do not add a Vercel project, a public `next start` on `0.0.0.0`, or a hosting config in this repo as part of that follow-up. The tunnel should publish the existing localhost process, with Access in front of it.
