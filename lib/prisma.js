import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

// Fix SSL warning: replace sslmode=require with sslmode=verify-full
let connectionString = process.env.DATABASE_URL || '';
connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');

const adapter = new PrismaPg({ connectionString });

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
