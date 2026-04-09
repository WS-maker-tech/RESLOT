import { PrismaClient } from "@prisma/client";

// Prevent multiple PrismaClient instances in serverless/hot-reload environments.
// In production (Vercel), each function invocation reuses the cached instance.
// DATABASE_URL should point to the pgBouncer pooled URL (port 6543).
// DIRECT_DATABASE_URL should point to the direct connection (port 5432) for migrations.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
