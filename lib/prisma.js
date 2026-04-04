import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Suppress SSL mode deprecation warning
process.env.NODE_NO_WARNINGS = '1';

const globalForPrisma = globalThis;

const connectionString = process.env.DATABASE_URL?.includes('sslmode=')
  ? process.env.DATABASE_URL
  : process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'sslmode=verify-full';

const adapter = new PrismaPg({
  connectionString,
});

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
