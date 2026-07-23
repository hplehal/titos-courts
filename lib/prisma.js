import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cache on globalThis in BOTH dev and prod. On Vercel, each warm serverless
// instance re-uses this module between invocations — without the singleton,
// every request creates a new pg pool and eventually exhausts the per-role
// connection limit on Prisma Postgres.
const globalForPrisma = globalThis;

function createClient() {
  // Prefer the pooled connection URL. Covers both common hosting conventions:
  //   - Vercel Postgres integration sets POSTGRES_PRISMA_URL (via PgBouncer)
  //   - Prisma Postgres (db.prisma.io) sets PRISMA_DATABASE_URL
  // Fall back to DATABASE_URL for local dev and generic setups.
  let connectionString =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.DATABASE_URL ||
    '';

  // Fix SSL warning: replace sslmode=require with sslmode=verify-full
  connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');

  // Cap pool size to stay under Prisma Postgres' per-role connection limit.
  // With PgBouncer multiplexing, one connection per warm instance is enough.
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;

export default prisma;
