# FCH — Production Deployment Guide

This guide takes the FCH storefront from this repository to a live, production
deployment on **Vercel + Neon PostgreSQL + Cloudinary + Resend**, ending with a
go-live checklist and an operations runbook. Every step is written so the store
owner (or any developer) can follow it top-to-bottom without prior Vercel
experience. Total time for a first deployment: **60–90 minutes**, most of it
waiting for DNS and email-domain verification.

---

## 1. Architecture overview

```
                 ┌──────────────────────────────┐
   Customers ──▶ │  Vercel (Next.js 16 App      │
                 │  Router, Node runtime)       │
                 │  • Storefront  /  /women ...  │
                 │  • Admin      /admin         │
                 │  • Cron       /api/cron/*    │
                 └───┬──────────┬─────────┬─────┘
                     │          │         │
            ┌────────▼───┐  ┌───▼────┐  ┌─▼─────────────┐
            │ Neon       │  │Cloudi- │  │ Resend        │
            │ PostgreSQL │  │nary    │  │ (email API)   │
            │ (data)     │  │(media) │  │ or SMTP       │
            └────────────┘  └────────┘  └───────────────┘
```

| Concern     | Production service | Local sandbox fallback |
|-------------|--------------------|------------------------|
| Database    | Neon PostgreSQL 17 | Portable Postgres via `scripts/pg-start.sh` |
| Media files | Cloudinary (signed uploads) | `public/uploads/media/` on disk |
| Payment screenshots | Cloudinary private folder `fch/payment-screenshots` | `uploads/payments/` via `/api/payments/[file]` |
| Email       | Resend HTTP API (or any SMTP) | Preview transport — email HTML stored in Admin → Email Log, nothing sent |
| Auth        | NextAuth credentials, admin-only, rate-limited | same |
| Order expiry cron | Vercel Cron (`vercel.json`, hourly) | run `curl` manually |

The app degrades gracefully: with no Cloudinary/Resend keys it still runs, but
uploaded media lives on ephemeral disk and emails are only *previewed*. For
production, complete steps 5 and 6.

---

## 2. Prerequisites

- A GitHub account and this repository pushed to GitHub.
- A **Vercel** account (free Hobby plan is enough to start; Pro recommended once
  traffic grows).
- A **Neon** account (free tier includes a project with branching and
  point-in-time restore).
- A **Cloudinary** account (free tier: 25 GB bandwidth/mo — ample for launch).
- A **Resend** account (free tier: 3,000 emails/mo, 100/day) **or** SMTP
  credentials from any provider.
- A domain, e.g. `fch.pk` / `fchstore.com`, with access to its DNS records.

---

## 3. Step 1 — Create the Neon database

1. In the Neon console, **Create project** → name it `fch`, choose the region
   closest to your customers (`AWS Singapore` or `AWS Mumbai` are good choices
   for Pakistan).
2. Open **Dashboard → Connection string → Pooled connection** and copy it. It
   looks like:
   ```
   postgresql://<user>:<password>@<ep-name>-<id>.aws.neon.tech/neondb?sslmode=require
   ```
3. Append `&pgbouncer=true&connect_timeout=15` if you use the pooled URL with
   server-side Prisma (Neon's copy button adds this for you in "Pooled" mode).
4. Save it — this is your `DATABASE_URL`. Neon's free tier pauses compute after
   5 minutes of inactivity; the first request after a pause adds ~500 ms, which
   is normal.

> **Note:** the schema targets PostgreSQL 14+ and uses no Postgres-specific
> extensions, so any managed Postgres (Supabase, RDS, Railway) works too — just
> use its connection string in place of Neon's.

---

## 4. Step 2 — Apply migrations (and optional seed)

From your machine, with the repo checked out:

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to the Neon connection string

bun install
bun run db:migrate          # applies every migration in prisma/migrations
bun run db:seed             # OPTIONAL: demo products, banners, coupons, CMS pages
```

- `db:migrate` is safe on an empty database and idempotent afterwards.
- `db:seed` **clears and re-creates** all demo content — never run it against a
  database that already holds real orders/products. For go-live you have two
  options:
  1. **Seed first, then edit** — seed once, log into `/admin`, delete the demo
     products, replace settings with your real ones, and upload real
     photography; or
  2. **Start empty** — skip the seed and create categories/products by hand in
     the admin panel (recommended for a clean launch).
- The seed creates the owner account `owner@fch.pk / ChangeMe#2024` —
  **change this password immediately after first login** (Step 7).

---

## 5. Step 3 — Import the repo into Vercel

1. Vercel → **Add New → Project** → select the GitHub repo `fch-store`.
2. Framework preset: **Next.js** (auto-detected). Build command and output can
   stay at their defaults — the repo's `output: "standalone"` setting only
   affects self-hosted builds and is ignored by Vercel.
3. Do **not** deploy yet — add environment variables first (Step 4), then
   click **Deploy**. The first build takes ~2 minutes.

After the first successful deploy, Vercel gives you a `*.vercel.app` URL you
can use immediately; a custom domain comes in Step 8.

---

## 6. Step 4 — Environment variables

In Vercel → Project → **Settings → Environment Variables**, add:

| Variable | Required | Value | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string | Same value you used for migrations |
| `NEXTAUTH_URL` | ✅ | `https://your-domain.com` | Full origin, no trailing slash. Drives absolute links in emails and canonical metadata |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` | Session signing key — rotate only when you want to log every admin out |
| `CRON_SECRET` | ✅ | long random string | Protects `/api/cron/expire-orders`; Vercel Cron sends it as a Bearer token |
| `CLOUDINARY_CLOUD_NAME` | production | Cloudinary **cloud name** | Media uploads fall back to ephemeral disk without it |
| `CLOUDINARY_API_KEY` | production | Cloudinary API key | |
| `CLOUDINARY_API_SECRET` | production | Cloudinary API secret | Keep secret; used for signed uploads |
| `RESEND_API_KEY` | production | Resend API key | Omit only if using SMTP |
| `EMAIL_FROM` | production | `FCH <orders@fch.pk>` | Must be a Resend-verified sender (Step 6) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | alternative | SMTP credentials | Set `SMTP_HOST` to activate; takes a back seat to Resend when both are present |

Rules of thumb:

- Set the same variables for **Production**, **Preview**, and **Development**
  environments in Vercel, but you may point Preview at a Neon *branch* database
  so previews never touch production data.
- Never commit a real `.env` — `.env.example` is the template and the source of
  truth for variable names.

---

## 7. Step 5 — Cloudinary (media)

1. Create the account; note the **cloud name** from the dashboard.
2. **API keys**: Dashboard → Settings → Access Keys → generate a key pair. Put
   the three values into Vercel env vars.
3. Folders used by the app (created automatically on first upload):
   - `media/` — product and banner images uploaded from Admin → Products /
     Banners (public assets, served via Cloudinary CDN);
   - `fch/payment-screenshots/` — customer payment screenshots. **Treat this
     folder as private**: in Cloudinary → Settings → Restricted, hide it from
     media library sharing; only admins open its URLs.
4. Uploads are **signed** (SHA-1 signature over folder/public_id/timestamp),
   so the API secret never reaches the browser.
5. **Why this matters on Vercel:** without Cloudinary, storefront media uploads
   are written to `public/uploads/` on the running instance — which Vercel
   wipes on every deploy and may not persist between serverless invocations.
   Cloudinary is the durable store; configure it before uploading real
   photography.

---

## 8. Step 6 — Resend (transactional email)

1. Create the account and generate an **API key** (Dashboard → API Keys).
2. **Verify your sending domain**: Resend → Domains → Add (`fch.pk`) → add the
   DKIM/SPF/DMARC TXT records it shows at your DNS provider → wait for
   verification (usually minutes, up to 24 h).
3. Set `EMAIL_FROM="FCH <orders@fch.pk>"` (any address @ your verified domain).
4. The app queues every email in the `email_log` table *inside the same DB
   transaction* as the business change, then delivers after commit via the
   Resend HTTP API. Duplicate sends are impossible (unique index + only
   `queued` rows are sent), and failures can be retried from
   **Admin → Email Log**.
5. **SMTP alternative:** set the `SMTP_*` variables instead — for example,
   any transactional provider or a branded mailbox via Hostinger/Zoho. When
   both Resend and SMTP are configured, Resend wins.

Emails sent: order confirmation, payment-received, payment-rejected, order
expired, shipping/tracking update, order cancellation, and the contact-form
acknowledgement — all rendered from the branded template in
`src/lib/email/templates.ts`.

---

## 9. Step 7 — First login & admin hardening

1. Visit `https://your-domain.com/admin` → sign in with
   `owner@fch.pk / ChangeMe#2024` (seeded) — or the credentials you chose if
   you started empty.
2. **Change the password immediately** (Admin → Account). Login is rate
   limited to 5 attempts / 15 min / email+IP.
3. Add a second admin account for redundancy before launch.

---

## 10. Step 8 — Custom domain

1. Vercel → Project → **Settings → Domains** → add `your-domain.com` and
   `www.your-domain.com`.
2. At your registrar, point DNS as Vercel instructs — typically:
   - Apex `A` record → `76.76.21.21`, or ALIAS/ANAME if supported;
   - `CNAME` for `www` → `cname.vercel-dns.com`.
3. HTTPS certificates are issued and renewed automatically by Vercel.
4. Set `NEXTAUTH_URL` to the final domain (with `https://`) and redeploy so
   email links and canonical URLs follow.
5. `.pk` domains: register through a PKNIC-approved reseller; PKNIC requires
   name servers before approval — point them at Vercel's DNS or your
   registrar's, then follow step 2.

---

## 11. Step 9 — Order-expiry cron

`vercel.json` in the repo already registers an hourly Vercel Cron:

```json
{ "crons": [{ "path": "/api/cron/expire-orders", "schedule": "0 * * * *" }] }
```

- The route expires unpaid orders past the payment-upload deadline, restores
  reserved stock, and queues branded expiry emails.
- It requires `CRON_SECRET` to be set; Vercel sends it automatically as
  `Authorization: Bearer <CRON_SECRET>`.
- Verify after deploy:

  ```bash
  curl -s https://your-domain.com/api/cron/expire-orders \
       -H "Authorization: Bearer $CRON_SECRET"
  # → {"expired": 0, ...}
  ```

- Deadlines are configurable in Admin → Settings
  (`payment_upload_deadline_hours`, `payment_approval_deadline_hours`).

---

## 12. Go-live checklist

Work through this list in order; every item has a place in the admin panel.

**Store settings (Admin → Settings) — replace every `TODO(OWNER)` / `[REPLACE]` value:**

- [ ] Bank name, account title, IBAN (shown at checkout for bank transfer)
- [ ] WhatsApp number, phone, contact email, shop address
- [ ] Instagram / Facebook / TikTok URLs
- [ ] Announcement bar text + free-shipping threshold
- [ ] Payment upload & approval deadlines

**Catalog & content:**

- [ ] Delete seeded demo products (or keep the ones you want); create real
      products with real photography via Admin → Products (uploads go to
      Cloudinary once configured)
- [ ] Review category tree (Women / Men / Kids subcategories) and menus
- [ ] Banners: replace seeded hero slides
- [ ] Pages: edit About, FAQ, Terms, Privacy (they ship with `TODO(OWNER)`
      placeholders — have Terms/Privacy legally reviewed before launch)

**Security & accounts:**

- [ ] Owner password changed; second admin created
- [ ] `NEXTAUTH_SECRET` and `CRON_SECRET` are long random strings, not defaults
- [ ] Cloudinary restricted-media-library setting applied to
      `fch/payment-screenshots`

**End-to-end test on production (do a real order with a small amount):**

- [ ] Place an order → bank-transfer instructions shown → upload payment
      screenshot as a customer would
- [ ] Admin → Orders: see the order, verify the payment → status emails arrive
- [ ] Email Log shows every message `sent` (not `preview`)
- [ ] Expire an unpaid test order (or wait for the cron) → stock restored,
      expiry email queued
- [ ] Track-order page works with the order number

**SEO & plumbing:**

- [ ] `/sitemap.xml` lists products, categories and pages;
      `/robots.txt` references it
- [ ] `/api/health` returns `{"status":"ok"}` (uptime monitor target)
- [ ] 404 page renders the branded not-found screen
- [ ] Metadata/OG previews look right (paste the URL into WhatsApp — the
      preview card should show the FCH title and description)

---

## 13. Operations runbook

**Daily**

- Admin → Orders: verify incoming payment screenshots within
  `payment_approval_deadline_hours`; approve/reject with a note (email is
  automatic).
- Admin → Email Log: any row with status `failed` has a **Retry** button.

**Weekly**

- Admin → Reports: sales summary, top products, low stock, exportable CSV
  (orders export includes the payment-verification trail).
- Admin → Inventory: restock low variants (low-stock is flagged at ≤ 3 units
  by the seed convention; thresholds live in the admin screens).

**Backups**

- Neon: free tier includes **point-in-time restore** (7 days) and historical
  branch copies. For extra safety, periodically run
  `pg_dump "$DATABASE_URL" > fch-backup-$(date +%F).sql` from your machine.
- Cloudinary: assets are versioned; enable automatic backup in Cloudinary
  settings if you want off-Cloudinary copies.

**Monitoring**

- Point an uptime monitor (UptimeRobot, BetterStack — free tiers) at
  `GET /api/health`. It checks the database round-trip, not just the process.
- Vercel Analytics (enable in the project) gives traffic and Core Web Vitals.

**Deploying changes**

- Push to `main` → Vercel builds and promotes automatically; rollbacks are
  one click (Deployments → previous build → **Promote**).
- Schema changes: commit the migration to the repo (`prisma/migrations`),
  then run `bun run db:migrate` against production from your machine (or via
  a one-off job) **before** the code that uses it deploys.

---

## 14. Troubleshooting

| Symptom | Likely cause & fix |
|---|---|
| Pages 500 on Vercel, `P1001` in logs | `DATABASE_URL` wrong/unreachable. Use the **pooled** Neon URL; ensure `sslmode=require` |
| Cron returns `401` | `CRON_SECRET` not set in Vercel env, or you're calling with a stale value. Vercel Cron only sends the header if the variable exists |
| Cron returns `500` "CRON_SECRET not configured" | Variable missing in the **Production** environment |
| Uploaded images vanish after a deploy | Cloudinary env vars not set — uploads were written to ephemeral disk. Configure Cloudinary, re-upload |
| Cloudinary upload `401` | API secret mismatch or system clock skew on the signing server (rare on Vercel) |
| Emails marked `sent` with a "preview transport" note | No `RESEND_API_KEY` and no `SMTP_HOST` — nothing was actually delivered. Configure a provider |
| Resend `403` on send | Sender domain not verified, or `EMAIL_FROM` uses an address outside a verified domain |
| Admin login locked out | Rate limit: 5 attempts / 15 min per email+IP. Wait, or clear `rate_limit` rows |
| Wrong links in emails (localhost) | `NEXTAUTH_URL` still points at localhost — fix it and redeploy |

---

## 15. Self-hosting alternative (Docker / VPS)

If you'd rather not use Vercel:

1. Provision PostgreSQL 14+ and set `DATABASE_URL`, `NEXTAUTH_URL`,
   `NEXTAUTH_SECRET`, `CRON_SECRET` (+ Cloudinary/Resend) in the environment.
2. Build and run the standalone server:

   ```bash
   bun install && bun run build
   NODE_ENV=production node .next/standalone/server.js   # PORT defaults to 3000
   ```

3. Put Nginx or Caddy in front for TLS; Caddy gives automatic certificates:
   `your-domain.com { reverse_proxy 127.0.0.1:3000 }`
4. Replace Vercel Cron with a system crontab entry:

   ```
   0 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/expire-orders
   ```

5. `uploads/` and `public/uploads/` are on real disk here — still prefer
   Cloudinary so multiple instances can share media.
