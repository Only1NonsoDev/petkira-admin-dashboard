# PetKira local admin

Invite-only Next.js admin for PetKira. It talks to Supabase Auth, row level security, and the `admin-manage` edge function from the browser.

Run it on your machine. The dev and start scripts bind to `127.0.0.1`.

Setup, sign-in, and the env vars are in [LOCAL_RUN.md](LOCAL_RUN.md).

Cloudflare Access and a tunnel are a later step, described in [PHASE2_CLOUDFLARE_ACCESS.md](PHASE2_CLOUDFLARE_ACCESS.md). This app is not set up for a public deploy.
