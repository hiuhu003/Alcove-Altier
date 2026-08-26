import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * On Vercel every serverless invocation may spin up a fresh module instance, so
 * the client is cached on `globalThis` to avoid exhausting Postgres connections
 * (this matters in dev too, where hot-reload re-imports the module).
 *
 * DATABASE_URL must point at Supabase's **pooled** connection (PgBouncer, port
 * 6543) with `?pgbouncer=true&connection_limit=1`; DIRECT_URL points at the
 * direct connection (port 5432) and is used only by the Prisma CLI for
 * migrations. See .env.example and the README.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cache in every environment: serverless containers are reused between requests.
globalForPrisma.prisma = prisma;
