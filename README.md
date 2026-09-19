# FCH — Fashion and Collection House

Production e-commerce platform for a Pakistani luxury clothing brand. Next.js App Router + TypeScript + TailwindCSS + shadcn/ui + Prisma (PostgreSQL, Neon-compatible) + NextAuth (admin-only) + Cloudinary-ready media + Resend-ready email.

## Run instructions (local)

```bash
# 1. Environment
cp .env.example .env          # then fill DATABASE_URL + NEXTAUTH_SECRET

# 2. Install
bun install                   # or npm install

# 3. Database (PostgreSQL 14+ / Neon)
bun run db:migrate            # apply migrations (prisma migrate dev)
bun run db:seed               # seed all demo data (prisma db seed)

# 4. Start
bun run dev                   # http://localhost:3000
bun run lint                  # code quality check
```

## Admin access

- URL: `/admin` → redirects to `/admin/login` when signed out
- Owner (seeded): **owner@fch.pk** / **ChangeMe#2024** — change after first login
- Login is rate-limited: 5 attempts / 15 min / email+IP

## Useful scripts

| Script | Purpose |
|---|---|
| `bun run db:migrate` | `prisma migrate dev` against `.env` DATABASE_URL |
| `bun run db:seed` | seed all tables (idempotent — clears and re-creates) |
| `bun run db:push` | schema push (quick prototyping; prefer migrations) |
| `bun run db:reset` | drop + re-apply migrations |
| `bun run lint` | ESLint |

> All `db:*` scripts load `.env` through `dotenv-cli -o` so the real PostgreSQL URL wins over any pre-set `DATABASE_URL`.

## Seeded demo data (prisma/seed.ts)

- 1 owner admin · 15 settings · 22 categories (Men/Women/Kids tree)
- 8 demo products · 15 placeholder images · 71 variants (incl. out-of-stock & low-stock demos)
- 8 delivery zones · 3 coupons (WELCOME10, FESTIVE500, FREESHIP)
- 3 banners · 4 pages (about, faq, terms, privacy) · 4 reviews (3 approved, 1 pending)
- All images are local SVG placeholders — `TODO(OWNER)` marks where to replace with real photos.

## Deployment

Vercel + Neon + Cloudinary + Resend — full guide arrives in **Phase 6** (DEPLOYMENT.md).
