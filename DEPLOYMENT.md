# FCH Store — Deployment Guide (Vercel + Neon + Cloudinary + Resend)

Target: **https://fch-store.scrutinies.dev** (subdomain of `scrutinies.dev`, DNS at **name.com**).

Do the steps **in order**. Steps 1–6 gather every value you will paste later, so
by the time you reach Vercel (step 7) all environment variables are ready.
Total time: ~60–90 minutes, mostly DNS/email verification waiting.

---

## STEP 0 — Create your environment variables file (do this FIRST)

Open a notepad and fill this table. Every blank is collected in steps 1–5;
step 6 turns it into the final list you paste into Vercel.

| # | Variable | Value | Where it comes from |
|---|----------|-------|---------------------|
| 1 | `DATABASE_URL` | `postgresql://…neon.tech/fch?sslmode=require` | Neon (step 1) |
| 2 | `NEXTAUTH_URL` | `https://fch-store.scrutinies.dev` | your subdomain — type it now |
| 3 | `NEXTAUTH_SECRET` | (long random string) | generate (step 2) |
| 4 | `CRON_SECRET` | (long random string) | generate (step 2) |
| 5 | `CLOUDINARY_CLOUD_NAME` | `…` | Cloudinary (step 3) |
| 6 | `CLOUDINARY_API_KEY` | `…` | Cloudinary (step 3) |
| 7 | `CLOUDINARY_API_SECRET` | `…` | Cloudinary (step 3) |
| 8 | `RESEND_API_KEY` | `re_…` | Resend (step 4) |
| 9 | `EMAIL_FROM` | `FCH Store <orders@fch-store.scrutinies.dev>` | decided — customers see only this |
| 10 | `EMAIL_REPLY_TO` | `you@your-personal-email.com` | your real inbox — hidden, receives replies |
| 11 | `DIRECT_URL` | `postgresql://…neon.tech/fch?sslmode=require` | Neon **direct** (non-pooled) URL (step 1) |

Copy-paste block (fill the brackets):

```bash
DATABASE_URL="postgresql://[user]:[pass]@[ep-xxx-pooler].neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[pass]@[ep-xxx].neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="https://fch-store.scrutinies.dev"
NEXTAUTH_SECRET="[paste openssl output]"
CRON_SECRET="[paste another openssl output]"
CLOUDINARY_CLOUD_NAME="[cloud name]"
CLOUDINARY_API_KEY="[api key]"
CLOUDINARY_API_SECRET="[api secret]"
RESEND_API_KEY="re_[api key]"
EMAIL_FROM="FCH Store <orders@fch-store.scrutinies.dev>"
EMAIL_REPLY_TO="[your personal email]"
```

How the masking works: every order/status email is sent **from** the store
address (`EMAIL_FROM`); your personal address only appears as the hidden
`Reply-To` (and only when a customer presses Reply). Customers never see it.

---

## STEP 1 — Database: create Neon (5 min)

1. Go to **neon.com** → Sign up (free) → **Create project**.
   - Name: `fch-store`. Region: the one closest to Pakistan (`aws-ap-south-1` Mumbai or similar).
2. On the dashboard, find **Connection string**. Copy **both**:
   - **Pooled** connection (host contains `-pooler`) → this is `DATABASE_URL`.
   - **Direct** connection (no `-pooler`) → this is `DIRECT_URL` (used only for running migrations).
3. Append `?sslmode=require` to both if not already present.
4. No need to create tables now — step 8 applies the migrations.

---

## STEP 2 — Generate the two secrets (1 min)

On your computer's terminal (or any online generator):

```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -base64 32   # → CRON_SECRET (run again)
```

Paste them into the STEP 0 table. They are just random strings — nothing to sign up for.

---

## STEP 3 — Media: create Cloudinary (10 min)

1. Go to **cloudinary.com** → Sign up free.
2. Console → **Settings → Access Keys** → copy **Cloud name**, **API key**, **API secret** into the table.
3. Create two folders (Media Library → New Folder):
   - `fch/products` — product photos (admin uploads here through the panel)
   - `fch/payments` — customer payment screenshots (**private**)
4. Make the payments folder private: Settings → Security → **Restricted media types / unsigned uploads OFF** is default; the app's `/api/admin/upload` route signs uploads with your API secret, so nothing is public unless you share a link. Payment screenshots are only viewable by the logged-in admin through the app.

> If you skip Cloudinary entirely, the store still works with the bundled
> placeholder images — you can add the key later and upload real photos
> through Admin → Products.

---

## STEP 4 — Email: create Resend + verify your subdomain (20 min, mostly waiting)

This is what makes mail come from the store, not from your personal Gmail.

1. Go to **resend.com** → Sign up → **API Keys → Create API key**
   - Name: `fch-store-production`, Permission: **Full access** (sending needs it).
   - Copy `re_…` into the table. **Show it only once — store it now.**
2. Left menu → **Domains → Add Domain**
   - Enter: `fch-store.scrutinies.dev`
   - Region: any (choose closest to your customers).
3. Resend shows a table of DNS records. **Add every record it shows at name.com** (do this together with the Vercel record in step 6 — see the combined DNS table below). Resend needs:
   - **DKIM** — 1–2 `CNAME` records (e.g. `resend._domainkey` / `smtp._domainkey`) → proves mail is really from you.
   - **SPF** — a `TXT` record on the subdomain host (e.g. `send` or `fch-store`) with `v=spf1 include:...~all` or a CNAME to Resend's bounce host — the dashboard shows the exact host/value.
   - **DMARC** (recommended) — a `TXT` record at `_dmarc.fch-store.scrutinies.dev`:
     `v=DMARC1; p=none; rua=mailto:you@your-personal-email.com`
4. Back in Resend press **Verify**. Records can take 5–60 min to propagate; keep pressing Verify until it turns **Verified**.
5. Your `EMAIL_FROM` = `FCH Store <orders@fch-store.scrutinies.dev>` is now authorised to send.

> Note: Resend is **outbound only** (order confirmations, status updates,
> contact-form notifications). Customers who reply land in
> `EMAIL_REPLY_TO`. There is no mailbox needed at name.com — the
> contact form and WhatsApp handle inbound customer messages.

---

## STEP 5 — Optional but recommended accounts

- **Google Search Console** (search.google.com/search-console) — add `fch-store.scrutinies.dev`, verify via DNS TXT at name.com, then submit `https://fch-store.scrutinies.dev/sitemap.xml`.
- **WhatsApp** — the site links a WhatsApp number from Admin → Settings; use your business number.

---

## STEP 6 — DNS records at name.com (10 min, propagates ≤ 1 hour)

Log in to **name.com** → My Domains → **scrutinies.dev** → **DNS / Manage DNS Records**.
Add these records. (Resend's values come from step 4 — theirs win if different.)

| Type | Host / Name | Value | Purpose |
|------|-------------|-------|---------|
| `CNAME` | `fch-store` | `cname.vercel-dns.com` | points the subdomain at Vercel |
| `CNAME` | `resend._domainkey.fch-store` (as shown by Resend) | (Resend DKIM value) | email authenticity |
| `TXT` or `CNAME` | as shown by Resend (SPF/bounce) | (Resend value) | email authenticity |
| `TXT` | `_dmarc.fch-store` | `v=DMARC1; p=none; rua=mailto:you@your-personal-email.com` | anti-spoof policy |

Tips:
- In name.com, entering host `fch-store` means `fch-store.scrutinies.dev`.
- If name.com auto-appends `.scrutinies.dev` to what you type, remove the
  duplicate — the final host must read exactly `fch-store` (Vercel) and
  whatever Resend prints for the email records.
- TTL: leave at default.

---

## STEP 7 — Deploy to Vercel (10 min)

1. Go to **vercel.com** → sign in **with GitHub** (authorize access to `SaqibMehdi123`).
2. **Add New… → Project** → Import **`fch-store`**.
3. Framework Preset: **Next.js** (auto). Build/install commands: leave defaults.
4. **Before pressing Deploy**: open **Environment Variables** and add all 11
   variables from your STEP 0 table, exactly by name. Select the
   Production/Preview/Development checkboxes (Production is the important one).
5. Press **Deploy**. First build takes 2–4 minutes.
6. It will deploy to a temporary `fch-store-xxx.vercel.app` — fine for now.

---

## STEP 8 — Create the database schema + seed (5 min)

From your own computer's terminal (one-time):

```bash
git clone https://github.com/SaqibMehdi123/fch-store.git
cd fch-store
bun install

# 1. tables
DATABASE_URL="<DIRECT_URL>" bunx prisma migrate deploy

# 2. demo catalog (products, categories, banners, admin user, pages)
DATABASE_URL="<DIRECT_URL>" bunx prisma db seed
```

> Production alternative: skip the demo seed and enter your real catalog
> through Admin → Products. But run the seed at least once — it creates the
> owner admin account and the CMS pages.

---

## STEP 9 — Connect the subdomain (5 min + DNS wait)

1. Vercel → your project → **Settings → Domains → Add** → type
   `fch-store.scrutinies.dev` → Add.
2. Vercel checks the `CNAME` from step 6. If it isn't visible yet, it shows
   "Invalid Configuration" — wait for DNS propagation and press **Refresh**.
3. When valid, Vercel issues the HTTPS certificate automatically (a few minutes).
4. Visit **https://fch-store.scrutinies.dev** — storefront live. 🎉

> Keep `NEXTAUTH_URL` exactly `https://fch-store.scrutinies.dev` — it drives
> canonical URLs, the sitemap, admin login cookies and email links.

---

## STEP 10 — Post-deploy verification (15 min)

Run through every surface — each should answer:

**Storefront (customer side)**

| URL | Expect |
|-----|--------|
| `https://fch-store.scrutinies.dev/` | homepage, banners, product rails |
| `/shop`, `/women`, `/men`, `/kids` | catalogues with working filters/sort/search |
| `/product/<any-slug>` | gallery, variants, reviews, JSON-LD |
| `/cart` → `/checkout` | full guest checkout with bank-transfer instructions |
| `/wishlist`, `/track-order` | localStorage wishlist, order lookup |
| `/about`, `/contact`, `/faq`, `/terms`, `/privacy` | CMS pages |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | 200s |
| random fake URL | branded 404 |

**Admin side**

| URL / action | Expect |
|-----|--------|
| `/admin/login` → owner@fch.pk / `ChangeMe#2024` | dashboard loads |
| Orders → open one → advance status | email fires via Resend |
| Products → new/edit → image upload | Cloudinary upload works |
| Settings | fill phone, WhatsApp, email, address, IBAN |
| Reports, Coupons, Banners, Pages, Team, Email Log | all open |

**Emails**

1. Place a real test order as a customer.
2. Check the customer's inbox: mail **from `FCH Store <orders@fch-store.scrutinies.dev>`**, not your personal address.
3. Hit Reply — it should address your personal inbox (masked).
4. Admin → Email Log shows every send with status.

**Cron (order expiry)**

- `vercel.json` schedules `GET /api/cron/expire-orders` hourly; Vercel
  injects your `CRON_SECRET` automatically. Check Admin → Orders: unpaid
  orders expire after their window and stock is restored.
- Manual test: `curl -X GET -H "Authorization: Bearer <CRON_SECRET>" https://fch-store.scrutinies.dev/api/cron/expire-orders` → `{"ok":true,...}`

---

## STEP 11 — Go-live hardening (10 min, DO NOT SKIP)

1. **Change the admin password** — Admin → Team → edit owner → set a strong password. The seeded one is public in this repo.
2. **Store details** — Admin → Settings: phone, WhatsApp, email, address, IBAN, free-shipping threshold, order-expiry window.
3. **Content** — Admin → Pages: replace the `TODO(OWNER)` placeholder text in About; review FAQ/Terms/Privacy.
4. **Products** — replace demo products with real ones (or delete them) and upload real photos to Cloudinary.
5. **Banners** — upload real hero banners (Admin → Banners).
6. **Search Console** — submit the sitemap (step 5).

---

## Operations runbook

| Task | How |
|------|-----|
| Update the site | push to `main` → Vercel auto-deploys (~2 min) |
| Change code that touched the Prisma schema | run `DATABASE_URL="<DIRECT_URL>" bunx prisma migrate deploy` **before** the deploy goes live |
| Roll back a bad deploy | Vercel → Deployments → ⋯ on last good one → **Promote to Production** |
| Check errors | Vercel → project → **Logs** (runtime) / **Build Logs** |
| Retry a failed email | Admin → Email Log → the failed row → Retry |
| Rotate Resend key | new key in Resend → update `RESEND_API_KEY` in Vercel → redeploy |
| Rotate CRON_SECRET | new value in Vercel env → redeploy (Vercel cron picks it up) |
| Free-tier limits | Neon: storage/compute hours · Cloudinary: 25 credits/mo · Resend: 100 emails/day (3,000/mo) — upgrade when the store grows |

## Troubleshooting

| Symptom | Cause → Fix |
|---------|-------------|
| Build fails with Prisma errors | `DATABASE_URL` missing/mistyped in Vercel env → recheck, redeploy |
| `/api/health` returns 503 | DB unreachable → check Neon is active (free tier pauses after inactivity; wake it in the Neon console) |
| Admin login loops back to login | `NEXTAUTH_URL` ≠ the domain in the browser bar, or `NEXTAUTH_SECRET` missing |
| Emails don't arrive | Resend domain not Verified yet, or `EMAIL_FROM` domain ≠ verified domain → finish step 4 |
| Emails in spam | DMARC record missing → add `_dmarc` TXT from step 4/6 |
| Domain shows Vercel 404 / NOT_FOUND | DNS CNAME not propagated yet, or host entered as `fch-store.scrutinies.dev.scrutinies.dev` in name.com |
| Cloudinary upload 401 | API secret mistyped in Vercel env |
| Cron 401 in logs | `CRON_SECRET` changed in Vercel but app not redeployed |
