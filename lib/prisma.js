import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

function createClient() {
  // Fix SSL warning: replace sslmode=require with sslmode=verify-full
  let connectionString = process.env.DATABASE_URL || '';
  connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');

  // Cap pool size to stay under Prisma Postgres' per-role connection limit.
  // Default (cpus * 2 + 1) is too high for hosted dev databases with low caps.
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

// Reuse a single Prisma client + adapter across hot reloads in development.
// Creating a new adapter on every reload leaks connection pools until the
// database role's connection limit is exhausted.
const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
