import { PrismaClient } from '@prisma/client';

const globalForArcturus = globalThis as unknown as { arcturusDb: PrismaClient | undefined };

// Guard: fail loudly at module init so the error is immediate and obvious,
// not a silent wrong-DB redirect (PrismaClient falls back to DATABASE_URL
// when the override URL is undefined).
const arcturusUrl = process.env.ARCTURUS_DB_URL;
if (!arcturusUrl) {
  throw new Error(
    '[arcturus-db] ARCTURUS_DB_URL is not set. ' +
    'Set it in .env to point at arcturus_main. ' +
    'Without it all arcturus queries would silently run against kodexa_hotel.',
  );
}

export const arcturusDb =
  globalForArcturus.arcturusDb ??
  new PrismaClient({
    datasources: {
      db: { url: arcturusUrl },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForArcturus.arcturusDb = arcturusDb;
}
