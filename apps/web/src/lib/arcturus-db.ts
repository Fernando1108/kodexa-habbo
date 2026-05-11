import { PrismaClient } from '@prisma/client';

const globalForArcturus = globalThis as unknown as { arcturusDb: PrismaClient | undefined };

export const arcturusDb =
  globalForArcturus.arcturusDb ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.ARCTURUS_DB_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForArcturus.arcturusDb = arcturusDb;
}
