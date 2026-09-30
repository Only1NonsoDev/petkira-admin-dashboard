# PetKira Admin – Local Run

Invite-only admin console (Next.js, glassmorphic UI). It binds to `127.0.0.1:3010` only, so it is not reachable from other machines.

> **Local only. Never push this live admin to the portfolio GitHub repo.**
> `petkira-admin-dashboard-portfolio.html` (repo root) stays a sample/placeholder demo with fake data and no keys. This app, `.env.local`, and `config.local.js` must never be published, deployed to a public host, or added to the `portfolio` remote.

## Setup

```powershell
cd local-admin
npm install
copy .env.example .env.local
```

Fill `.env.local`:

| Variable | Where it runs | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` | browser + server | Public anon key only. RLS + `is_admin()` is the real gate. |
| `OPENAI_API_KEY` (`OPENAI_MODEL` optional) | **server only** | Feedback analysis + support reply drafts |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | **server only** | Support replies, user emails, broadcasts |

Never put `service_role` keys anywhere. Never prefix OpenAI/Resend with `NEXT_PUBLIC_`. `.env.local` is gitignored; only `.env.example` (placeholders) is committed.

## Run

```powershell
npm run dev      # http://127.0.0.1:3010
# or
npm run build
npm start        # also 127.0.0.1:3010
```

## Screens

| Route | Screen | Data |
|---|---|---|
| `/` | App Health | counts + 7-day signups from `profiles`, `bugs`, `support_emails` |
| `/analytics` | User Analytics | views `user_events_activity_summary`, `daily_active_users`, `feature_popularity`; table `user_events` |
| `/users` | Users & Subscribers | `profiles` (free / pro / family + founding), email modal |
| `/feedback` | Beta Feedback | `feedback`; AI analysis via `/api/ai/feedback-analysis` |
| `/support` | Support Inbox | `support_emails` (`from_email`); AI draft, send, archive |
| `/bugs` | Bug Tracker | `bugs`; status updates, Claude Code prompt |
| `/sentry` | Sentry Bugs | `sentry_events`; plain-English blurb, Claude Code prompt |
| `/broadcast` | Broadcast | segment → `/api/email/broadcast` (Resend) |
| `/admins` | Admins | `admin-manage` edge function (list / invite / revoke) |

## How access works

- No signup page. Accounts are created only by invite (Admins → `admin-manage` edge function).
- After email/password sign-in the app calls `supabase.rpc("is_admin")`. Anything other than `true` signs the user out (fail closed).
- Data pages use the anon key plus the signed-in user's JWT, so RLS is the real gate. Failed queries show an error state — the app never falls back to demo data.
- Server routes (`/api/ai/*`, `/api/email/*`) require: request host is `localhost`/`127.0.0.1`, a valid Supabase JWT in `Authorization: Bearer`, and `is_admin() === true`. Only then are OpenAI / Resend called. Keys never reach the client bundle.
- Broadcast recipients are resolved server-side from `profiles`; the client only picks a segment. Sending requires an explicit confirm step showing the real recipient count.

## Behaviour notes

- Selects are capped (profiles 500, bugs/feedback/support 200, sentry 100, events 25) and ordered newest first.
- Writes (bug status, support read/archive/replied) use the admin's JWT. If RLS has no admin UPDATE policy the UI shows an error and rolls back rather than pretending it worked.
- Without `OPENAI_API_KEY` or `RESEND_API_KEY`, the matching actions show a clear "not configured" message and send nothing.
- Bug "Notify affected users" is an honest stub (toast only) — bugs have no user-email mapping.
- Resend's default sender (`onboarding@resend.dev`) only delivers to your own account email; set `RESEND_FROM_EMAIL` to a verified domain for real sends.
- The Admins page assumes `list` returns an array (or `{ admins }` / `{ data }`); adjust `src/app/admins/page.tsx` if the function's shape differs.

See `PHASE2_CLOUDFLARE_ACCESS.md` for the optional extra access layer.
