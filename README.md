# PetKira

Sanitized portfolio demo of the PetKira admin dashboard, plus a local-only operations app.

| Path | Purpose |
| --- | --- |
| `petkira-admin-dashboard-portfolio.html` | Public demo with placeholder keys and sample data. Keep live secrets out of this file. |
| `local-admin/` | Private Next.js admin for real operations. It runs on your machine and uses Supabase Auth, row level security, and the `admin-manage` edge function. |

Use `local-admin/` for private ops. Start with [local-admin/LOCAL_RUN.md](local-admin/LOCAL_RUN.md).

Run that app on localhost. Hosting it on Vercel or another public platform is outside this repo. A later private path, Cloudflare Access in front of a tunnel, is described in [local-admin/PHASE2_CLOUDFLARE_ACCESS.md](local-admin/PHASE2_CLOUDFLARE_ACCESS.md).
