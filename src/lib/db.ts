import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

/**
 * Sandbox guard: this sandbox exports a legacy sqlite `DATABASE_URL`
 * process-wide (file:.../db/custom.db), and Next.js never lets .env files
 * override pre-existing env vars. The project's real PostgreSQL URL lives in
 * `.env`, so if we detect the sqlite placeholder we read the URL from `.env`
 * ourselves. In production (Vercel + Neon) DATABASE_URL is always a proper
 * postgres:// URL and this shim is a no-op.
 */
function resolveDatabaseUrl(): string | undefined {
  const current = process.env.DATABASE_URL
  if (current && !current.startsWith('file:')) return current

  try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
    const match = envFile.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)
    if (match?.[1]) {
      process.env.DATABASE_URL = match[1]
      return match[1]
    }
  } catch {
    // .env not readable — fall through to Prisma's own error handling
  }
  return current
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

resolveDatabaseUrl()

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
