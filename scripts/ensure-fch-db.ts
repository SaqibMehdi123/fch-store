/**
 * One-off helper: ensure the local sandbox `fch` database exists.
 * Connects to the maintenance `postgres` database and CREATE DATABASE if missing.
 * Usage: bun scripts/ensure-fch-db.ts
 */
import { PrismaClient } from "@prisma/client";

const MAINTENANCE_URL = "postgresql://postgres@127.0.0.1:5432/postgres";

async function main() {
  const client = new PrismaClient({ datasources: { db: { url: MAINTENANCE_URL } } });
  const rows = await client.$queryRawUnsafe<{ datname: string }[]>(
    `SELECT datname FROM pg_database WHERE datname = 'fch'`,
  );
  if (rows.length === 0) {
    await client.$executeRawUnsafe(`CREATE DATABASE "fch"`);
    console.log("created database fch");
  } else {
    console.log("database fch already exists");
  }
  await client.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
