import { PrismaClient } from '@prisma/client';

const globalForArcturusDev = globalThis as unknown as { arcturusDevDb: PrismaClient | undefined };

// Guard: fail loudly if ARCTURUS_DEV_DB_URL is not set.
// PrismaClient would silently fall back to DATABASE_URL (kodexa_hotel),
// which would corrupt the dev flow with production data.
const arcturusDevUrl = process.env.ARCTURUS_DEV_DB_URL;
if (!arcturusDevUrl) {
  throw new Error(
    '[arcturus-dev-db] ARCTURUS_DEV_DB_URL is not set. ' +
    'Set it in .env to point at arcturus_dev. ' +
    'Without it dev queries would silently run against kodexa_hotel.',
  );
}

export const arcturusDevDb =
  globalForArcturusDev.arcturusDevDb ??
  new PrismaClient({
    datasources: {
      db: { url: arcturusDevUrl },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForArcturusDev.arcturusDevDb = arcturusDevDb;
}
