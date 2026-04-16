import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cache on globalThis in BOTH dev and prod. On Vercel, each warm serverless
// instance re-uses this module between invocations — without the singleton,
// every request creates a new pg pool and eventually exhausts the per-role
// connection limit on Prisma Postgres.
const globalForPrisma = globalThis;

function createClient() {
  // Prefer the pooled connection URL provided by Vercel Postgres integration
  // (POSTGRES_PRISMA_URL routes through PgBouncer), fall back to DATABASE_URL.
  let connectionString =
    process.env.POSTGRES_PRISMA_URL ||
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
