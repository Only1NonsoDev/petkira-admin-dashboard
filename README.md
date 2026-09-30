# PetKira Admin Dashboard (portfolio demo)

## Live demo

Open the deployed demo in a browser:

**[https://petkira-admin-dashboard.vercel.app](https://petkira-admin-dashboard.vercel.app)**

Alias: [https://petkira-admin-dashboard-only1nonsodev.vercel.app](https://petkira-admin-dashboard-only1nonsodev.vercel.app)

This is a **portfolio DEMO** with invented sample data and a **DEMO** badge. It uses no real PetKira API keys and no production data. On the login screen, click **Enter demo console**.

Local run still works: copy `.env.example` to `.env.local` and keep `NEXT_PUBLIC_DEMO_MODE=true`. See [Run the demo](#run-the-demo) below.

**This is a portfolio demonstration, NOT the production admin.** Every user, email, bug, crash and metric shown in demo mode is invented sample data. No real customer data is included.

A Next.js admin console with a glass UI covering app health, user analytics, subscribers, beta feedback, a support inbox with AI reply drafts, bug tracking, Sentry crash reports, email broadcast and admin management.

## Run the demo

1. Copy the example env file:
   - macOS/Linux: `cp .env.example .env.local`
   - Windows PowerShell: `Copy-Item .env.example .env.local`
2. Make sure `.env.local` contains `NEXT_PUBLIC_DEMO_MODE=true`. No Supabase, OpenAI or Resend keys are needed.
3. Install and start:
   ```
   npm install
   npm run dev
   ```
4. Open <http://127.0.0.1:3010> (the port is set in `package.json`) and click **Enter demo console**.

In demo mode a **DEMO** badge is shown, AI analysis, email sending and broadcasts return canned responses, and status changes only update local state. Nothing calls Supabase, OpenAI or Resend.

## Live mode

Remove `NEXT_PUBLIC_DEMO_MODE` (or set it to `false`) and fill in the Supabase and server-side keys in `.env.local`. See `LOCAL_RUN.md` for details.

## Checks

```
npm run lint   # tsc --noEmit
```

## Security note

Never commit `.env.local` or real keys. Do not put real Supabase, OpenAI, Resend, or PetKira API keys in a public fork. `.env.local` is gitignored; keep it that way.
