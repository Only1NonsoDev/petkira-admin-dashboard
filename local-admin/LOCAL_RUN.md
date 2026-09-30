# Run PetKira Admin locally

This Next.js app is the private operations console. It stays on your computer. Sign-in is invite-only: there is no signup screen.

The portfolio file at the repo root (`petkira-admin-dashboard-portfolio.html`) is a sanitized demo. Leave it as it is. Live admin work happens here.

## 1. Install

From `local-admin/`:

```bash
npm install
```

Node.js 22 is enough. Node 20 also works with this Next.js version.

## 2. Environment

```bash
cp .env.example .env.local
```

Fill `.env.local` with public client values only:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://flltgfysnuhhfoiatheu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://flltgfysnuhhfoiatheu.supabase.co/functions/v1
```

Copy the anon key from the Supabase dashboard under Project Settings → API. `.env.local` stays untracked.

`NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` is the functions base (`.../functions/v1`), with no function name on the end. The Admins page posts to `{FUNCTIONS_URL}/admin-manage`.

Keep these out of the app and out of git:

- service role key
- OpenAI keys
- Resend keys
- any other server secret

The browser sends the anon key as the `apikey` header (the Supabase gateway expects it) and the signed-in user's access token as `Authorization: Bearer`.

## 3. Start on localhost

```bash
npm run dev
```

That script is:

```bash
next dev -H 127.0.0.1 -p 3000
```

Next.js 16 otherwise listens on `0.0.0.0`. Keep the `-H 127.0.0.1` flag so the dev server is loopback only.

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

To run the production build on the same machine:

```bash
npm run build
npm start
```

`npm start` is `next start -H 127.0.0.1 -p 3000`.

## 4. Sign in

Use the email and password of an invited admin. After `signInWithPassword`, the app calls `supabase.rpc('is_admin')`.

- `true`: the dashboard opens.
- `false`: the app signs out and shows **Not an admin account.** Disabled rows (`disabled_at` set) fail this check.
- RPC error: the app signs out and shows the verification error.

There is no public signup control, and the client never calls `signUp`.

## 5. Admins page

List, invite, and revoke call `POST {FUNCTIONS_URL}/admin-manage` with JSON:

```json
{ "action": "list" }
{ "action": "invite", "email": "person@example.com" }
{ "action": "revoke", "user_id": "uuid" }
```

The signed-in user cannot revoke their own row. The button stays disabled, and the function also rejects that case. Revoking the last active owner returns an error, which the page shows.

Invite mail is sent by Supabase Auth. For an invite or recovery link to land back on this app, add `http://127.0.0.1:3000` to the project's Auth site URL or redirect allow list. When the function returns an `invite_link`, the page shows it so you can hand it to that person directly.

## 6. What the lists read

These pages are read-only and rely on admin row level security:

| Page | Table | Order |
| --- | --- | --- |
| Bugs | `bugs` | `created_at` desc |
| Feedback | `feedback` | `created_at` desc |
| Support | `support_emails` | `received_at` desc |
| Sentry | `sentry_events` | `received_at` desc |
| Analytics | `user_events` | `created_at` desc |

Admin accounts themselves are loaded through `admin-manage`, not a direct table write from the browser.
