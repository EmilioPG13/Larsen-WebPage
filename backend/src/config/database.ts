import { PrismaClient } from '@prisma/client';

/**
 * A single client shared across invocations. On Vercel each warm lambda reuses
 * this module, and in development tsx re-imports it on every reload; caching on
 * globalThis keeps either case from opening a new connection pool each time.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
