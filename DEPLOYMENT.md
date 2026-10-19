# FCH Store — Deployment Guide (Vercel + Neon + Cloudinary + Resend)

Target: **https://fch-store.scrutinies.dev** (subdomain of `scrutinies.dev`, DNS at **name.com**).

Do the steps **in order**. Steps 1–6 gather every value you will paste later, so
by the time you reach Vercel (step 7) all environment variables are ready.
Total time: ~60–90 minutes, mostly DNS propagation waiting.

**Your email architecture (already decided):**

```
Customer receives email:  From: FCH Store <orders-fch-store@scrutinies.dev>   ← what everyone sees
Customer hits Reply  ──▶  orders-fch-store@scrutinies.dev
                          (name.com email forwarding)
                       ──▶  saqibmehdi234@gmail.com                            ← your real inbox, hidden
```

- **Outbound** (order confirmations, status updates) is sent by **Resend**,
  authorised to send as `scrutinies.dev`.
- **Inbound** (replies) is your **name.com forwarder**
  `orders-fch-store@scrutinies.dev → saqibmehdi234@gmail.com` (already created ✓).
- Your Gmail address never appears to customers.

---

## STEP 0 — Create your environment variables file (do this FIRST)

Open a notepad and fill this table. Every blank is collected in steps 1–5;
step 6 turns it into the final list you paste into Vercel.

| # | Variable | Value | Where it comes from |
|---|----------|-------|---------------------|
| 1 | `DATABASE_URL` | `postgresql://…-pooler.neon.tech/…?sslmode=require` | Neon **pooled** URL (step 1) |
| 2 | `DIRECT_URL` | `postgresql://…neon.tech/…?sslmode=require` | Neon **direct** URL (step 1) |
| 3 | `NEXTAUTH_URL` | `https://fch-store.scrutinies.dev` | fixed — type it now |
| 4 | `NEXTAUTH_SECRET` | (long random string) | generate (step 2) |
| 5 | `CRON_SECRET` | (another long random string) | generate (step 2) |
| 6 | `CLOUDINARY_CLOUD_NAME` | `…` | Cloudinary (step 3) |
| 7 | `CLOUDINARY_API_KEY` | `…` | Cloudinary (step 3) |
| 8 | `CLOUDINARY_API_SECRET` | `…` | Cloudinary (step 3) |
| 9 | `RESEND_API_KEY` | `re_…` | Resend (step 4) |
| 10 | `EMAIL_FROM` | `FCH Store <orders-fch-store@scrutinies.dev>` | fixed — your masked store address |
| 11 | `EMAIL_REPLY_TO` | *(leave empty — optional)* | replies already flow via name.com forwarder |

Copy-paste block (fill the brackets):

```bash
DATABASE_URL="postgresql://[user]:[pass]@[ep-xxx-pooler].neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[pass]@[ep-xxx].neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="https://fch-store.scrutinies.dev"
NEXTAUTH_SECRET="[paste openssl output]"
CRON_SECRET="[paste second openssl output]"
CLOUDINARY_CLOUD_NAME="[cloud name]"
CLOUDINARY_API_KEY="[api key]"
CLOUDINARY_API_SECRET="[api secret]"
RESEND_API_KEY="re_[api key]"
EMAIL_FROM="FCH Store <orders-fch-store@scrutinies.dev>"
```

---

## STEP 1 — Database: create Neon (5 min)

1. Go to **neon.com** → Sign up (free) → **Create project**.
   - Name: `fch-store`. Region: closest to Pakistan (`aws-ap-south-1` Mumbai or similar).
2. On the dashboard, find **Connection string**. Copy **both**:
   - **Pooled** connection (host contains `-pooler`) → this is `DATABASE_URL`.
   - **Direct** connection (no `-pooler`) → this is `DIRECT_URL` (used only by migrations).
3. Make sure both end with `?sslmode=require`.
4. No need to create tables now — step 8 applies the migrations.

---

## STEP 2 — Generate the two secrets (1 min)

On your computer's terminal:

```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -base64 32   # → CRON_SECRET (run again)
```

Paste into the STEP 0 table. Just random strings — nothing to sign up for.

---

## STEP 3 — Media: create Cloudinary (10 min)

1. Go to **cloudinary.com** → Sign up free.
2. Console → **Settings → Access Keys** → copy **Cloud name**, **API key**, **API secret** into the table.
3. Create two folders (Media Library → New Folder):
   - `fch/products` — product photos (uploaded via Admin → Products)
   - `fch/payments` — customer payment screenshots (**stay private**)

> Payment screenshots are only viewable by the logged-in admin through the
> app. The upload route signs uploads with your API secret, so nothing is
> public unless you share a link.
>
> If you skip Cloudinary entirely, the store still works with the bundled
> placeholder images — you can add the keys later and upload real photos
> through Admin → Products.

---

## STEP 4 — Email: create Resend + verify the ROOT domain (20 min, mostly waiting)

Resend must be authorised to **send as** `orders-fch-store@scrutinies.dev`,
so we verify the root domain `scrutinies.dev` (NOT the subdomain — your
forwarder lives on the root).

1. Go to **resend.com** → Sign up → **API Keys → Create API key**
   - Name: `fch-store-production`, Permission: **Full access** (sending needs it).
   - Copy `re_…` into the table. Shown only once — store it now.
2. Left menu → **Domains → Add Domain**
   - Enter exactly: `scrutinies.dev`
   - Region: any (closest to your customers).
3. Resend shows DNS records (DKIM `CNAME`s like `resend._domainkey`, an SPF
   `TXT`/`CNAME` like `send`, etc.). **Add every record exactly as Resend
   prints it** — combined with the Vercel record in the DNS table (step 6).
   Also add the recommended **DMARC** record yourself (step 6, last row).
4. Back in Resend press **Verify**. Records can take 5–60 min to propagate;
   keep pressing Verify until the domain turns **Verified**.
5. From now on Resend accepts `From: FCH Store <orders-fch-store@scrutinies.dev>`.

> Who does what: Resend = outbound mail. name.com forwarding = inbound
> replies. There is no mailbox to rent anywhere — the store's contact form
> and WhatsApp button handle customer-initiated messages.

---

## STEP 5 — Optional but recommended

- **Google Search Console** (search.google.com/search-console) → add
  `https://fch-store.scrutinies.dev` → verify via DNS TXT at name.com →
  submit `https://fch-store.scrutinies.dev/sitemap.xml`.
- **WhatsApp** — the site shows the number from Admin → Settings; use your business number.

---

## STEP 6 — DNS records at name.com (10 min, propagates ≤ 1 hour)

Log in to **name.com** → My Domains → **scrutinies.dev** → **DNS / Manage DNS Records**.
(Your email-forwarding MX records are already there — leave them.)

| Type | Host / Name | Value | Purpose |
|------|-------------|-------|---------|
| `CNAME` | `fch-store` | `cname.vercel-dns.com` | points the subdomain at Vercel |
| `CNAME` | `resend._domainkey` (as printed by Resend) | (Resend DKIM value) | proves mail is yours |
| `TXT`/`CNAME` | `send` or as printed by Resend | (Resend SPF/bounce value) | sender auth |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:saqibmehdi234@gmail.com` | anti-spoof policy (reports go to your Gmail) |

Tips:
- In name.com, entering host `fch-store` means `fch-store.scrutinies.dev` —
  don't type the full domain into the host box (it would double-append).
- Resend's host boxes may already show the full record name
  (e.g. `resend._domainkey.scrutinies.dev`) — in that case strip the
  `.scrutinies.dev` part when entering it at name.com.
- TTL: leave at default.

---

## STEP 7 — Deploy to Vercel (10 min)

1. Go to **vercel.com** → sign in **with GitHub** (authorize access to `SaqibMehdi123`).
2. **Add New… → Project** → Import **`fch-store`**.
3. Framework Preset: **Next.js** (auto). Build/install commands: leave defaults.
4. **Before pressing Deploy**: open **Environment Variables** and add the
   10 variables from your STEP 0 table, exactly by name (check Production).
5. Press **Deploy**. First build takes 2–4 minutes.
6. It deploys to a temporary `fch-store-xxx.vercel.app` — fine for now.

---

## STEP 8 — Create the database schema + seed (5 min, one-time)

From your own computer's terminal:

```bash
git clone https://github.com/SaqibMehdi123/fch-store.git
cd fch-store
bun install

# 1. create all tables (uses the DIRECT connection)
DATABASE_URL="<DIRECT_URL>" bunx prisma migrate deploy

# 2. demo catalog + admin owner account + CMS pages
DATABASE_URL="<DIRECT_URL>" bunx prisma db seed
```

> The seed creates the admin login `owner@fch.pk` / `ChangeMe#2024` —
> **change that password in step 11.**

---

## STEP 9 — Connect the subdomain (5 min + DNS wait)

1. Vercel → your project → **Settings → Domains → Add** → `fch-store.scrutinies.dev` → Add.
2. Vercel checks the `CNAME` from step 6. If not visible yet it shows
   "Invalid Configuration" — wait for DNS propagation and press **Refresh**.
3. When valid, Vercel issues the HTTPS certificate automatically (few minutes).
4. Visit **https://fch-store.scrutinies.dev** — storefront live. 🎉

> `NEXTAUTH_URL` must be exactly `https://fch-store.scrutinies.dev` — it
> drives canonical URLs, the sitemap, admin login cookies and email links.

---

## STEP 10 — Post-deploy verification (15 min)

**Storefront (customer side)**

| URL | Expect |
|-----|--------|
| `https://fch-store.scrutinies.dev/` | homepage, banners, product rails |
| `/shop`, `/women`, `/men`, `/kids` | catalogues, working filters/sort/search |
| `/product/<any-slug>` | gallery, variants, reviews |
| `/cart` → `/checkout` | full guest checkout, bank-transfer instructions |
| `/wishlist`, `/track-order` | localStorage wishlist, order lookup |
| `/about`, `/contact`, `/faq`, `/terms`, `/privacy` | CMS pages |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | 200 |
| any random fake URL | branded 404 |

**Admin side**

| Action | Expect |
|--------|--------|
| `/admin/login` → owner@fch.pk / `ChangeMe#2024` | dashboard loads |
| Orders → open one → advance status | email fires via Resend |
| Products → new/edit → image upload | Cloudinary upload works |
| Settings | fill phone, WhatsApp, email, address, IBAN |
| Reports, Coupons, Banners, Pages, Team, Email Log | all open |

**Email test (the masking proof)**

1. Place a real test order as a customer with your Gmail.
2. The email must show **From: FCH Store `<orders-fch-store@scrutinies.dev>`**.
3. Press Reply in Gmail — it addresses the same store address; because of the
   name.com forwarder the reply still lands in your Gmail. Your Gmail address
   never appears to the customer.
4. Admin → Email Log shows every send with status.

**Cron (order expiry)**

- `vercel.json` schedules `GET /api/cron/expire-orders` **daily at 03:00 UTC
  (08:00 PKT)**; Vercel injects your `CRON_SECRET` automatically.
- Daily is the maximum frequency allowed on the Vercel Hobby (free) plan.
  With the default 24-hour upload deadline, an abandoned order can hold its
  stock for up to ~48 hours before expiry. If you need tighter cleanup,
  either upgrade to Vercel Pro or add a free external scheduler
  (e.g. cron-job.org or a GitHub Actions scheduled workflow) that hits the
  same endpoint more often — it is idempotent, so extra calls are safe.
- Manual test: `curl -X GET -H "Authorization: Bearer <CRON_SECRET>" https://fch-store.scrutinies.dev/api/cron/expire-orders` → `{"ok":true,...}`

---

## STEP 11 — Go-live hardening (10 min, DO NOT SKIP)

1. **Change the admin password** — Admin → Team → edit owner. The seeded password is public in this repo.
2. **Store details** — Admin → Settings: phone, WhatsApp, email (`orders-fch-store@scrutinies.dev`), address, IBAN, free-shipping threshold, order-expiry window.
3. **Content** — Admin → Pages: replace the `TODO(OWNER)` placeholder in About; review FAQ/Terms/Privacy.
4. **Products** — replace/delete the demo products, upload real photos.
5. **Banners** — upload real hero banners (Admin → Banners).
6. **Search Console** — submit the sitemap (step 5).

---

## Operations runbook

| Task | How |
|------|-----|
| Update the site | push to `main` → Vercel auto-deploys (~2 min) |
| Schema changed | `DATABASE_URL="<DIRECT_URL>" bunx prisma migrate deploy` **before** the deploy goes live |
| Roll back a bad deploy | Vercel → Deployments → ⋯ on last good one → **Promote to Production** |
| Check errors | Vercel → project → **Logs** (runtime) / **Build Logs** |
| Retry a failed email | Admin → Email Log → failed row → Retry |
| Rotate Resend key | new key in Resend → update `RESEND_API_KEY` in Vercel → redeploy |
| Rotate CRON_SECRET | new value in Vercel env → redeploy |
| Free-tier limits | Neon: storage/compute hours · Cloudinary: 25 credits/mo · Resend: 100 emails/day, 3,000/mo · name.com forwarding: free |

## Troubleshooting

| Symptom | Cause → Fix |
|---------|-------------|
| Build fails with Prisma errors | `DATABASE_URL` missing/mistyped in Vercel env → recheck, redeploy |
| `/api/health` returns 503 | DB unreachable → Neon free tier pauses after inactivity; wake it in the Neon console |
| Admin login loops back to login | `NEXTAUTH_URL` ≠ domain in the browser bar, or `NEXTAUTH_SECRET` missing |
| Emails not sending ("403 domain not verified") | Resend domain not Verified yet, or `EMAIL_FROM` uses a different domain than the verified `scrutinies.dev` |
| Emails land in spam | DMARC record missing → add `_dmarc` TXT (step 6) |
| Replies never arrive at Gmail | name.com forwarder disabled → re-check forwarding rule for `orders-fch-store@scrutinies.dev` |
| Domain shows Vercel 404 / NOT_FOUND | CNAME not propagated yet, or host entered as `fch-store.scrutinies.dev` (doubled) in name.com |
| Cloudinary upload 401 | API secret mistyped in Vercel env |
| Cron 401 in logs | `CRON_SECRET` changed in Vercel but app not redeployed |
