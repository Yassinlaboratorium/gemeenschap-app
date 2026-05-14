# Deployment Guide

## Environment Variables

Create a `.env.local` file (never commit this) with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Mollie
MOLLIE_API_KEY=live_<key>          # or test_<key> for test mode

# App URL (no trailing slash)
NEXT_PUBLIC_APP_URL=https://yourdomain.be
```

For production on Vercel, set these in **Project Settings → Environment Variables**.

---

## Supabase Setup

### 1. Run migrations in order

In Supabase Dashboard → SQL Editor, run each file in sequence:

1. `supabase/01_tables.sql`
2. `supabase/02_logic.sql`
3. `supabase/03_payments.sql`
4. `supabase/04_sessions_and_children.sql`
5. `supabase/05_fix_rls_policies.sql`

### 2. Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://yourdomain.be`
- **Redirect URLs** (add all):
  - `https://yourdomain.be/**`
  - `http://localhost:3000/**` (for local development)

The password reset email uses `NEXT_PUBLIC_APP_URL/reset-password` as the redirect target. If you update the domain, update `NEXT_PUBLIC_APP_URL` accordingly — no code change needed.

### 3. Email templates (optional)

Supabase's default reset email links to `{{ .ConfirmationURL }}` which already points to your configured redirect URL. No customisation required unless you want branded emails.

---

## Mollie Setup

### 1. Webhook URL

In the Mollie Dashboard → Developers → Webhooks, or per-payment via the API:

- Webhook endpoint: `https://yourdomain.be/api/webhooks/mollie`
- The app sets this automatically in `WEBHOOK_URL` when `NEXT_PUBLIC_APP_URL` is not localhost.

### 2. Local development

Mollie cannot reach `localhost`. Options:

- Use [ngrok](https://ngrok.com) or [localtunnel](https://theboroer.github.io/localtunnel-www/): `ngrok http 3000`, then set `NEXT_PUBLIC_APP_URL=https://<ngrok-url>` in `.env.local`.
- Or leave `NEXT_PUBLIC_APP_URL=http://localhost:3000` — the app will skip the webhook URL and you can confirm payments manually via the Mollie test dashboard.

### 3. Test vs live keys

- Test key (`test_…`): payments never charge real money; use Mollie test payment methods.
- Live key (`live_…`): real payments; only use in production.

---

## First Admin User

After deploying and creating your first account via `/register`:

```sql
UPDATE profiles SET is_admin = true WHERE id = '<user-uuid>';
```

Run this once in Supabase SQL Editor. Subsequent admins can be set via the admin panel once you are logged in.
