import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessDevelopment } from '@/lib/guards';
import { arcturusDevDb } from '@/lib/arcturus-dev-db';

interface ArcturusDevUser {
  id:      number;
  credits: number;
}

interface UserCurrency {
  type:   number;
  amount: number;
}

/**
 * GET /api/dev/wallet
 *
 * Returns wallet balances from arcturus_dev — NEVER from arcturus_main.
 * Requires authenticated session with rank >= 9 (Developer / Founder).
 *
 * Response:
 *   { ok: true, source: 'arcturus_dev', wallet: { credits, pixels, diamonds } }
 *
 * If user is not yet synced to arcturus_dev, falls back to kodexa_hotel values.
 * user_id is NEVER accepted from the client — always derived from session.
 */
export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Fresh rank — dev endpoints require rank >= 9 ──────────────────────────
  const kodexaUser = await prisma.user.findUnique({
    where:  { id: parseInt(session.user.id) },
    select: { email: true, rank: true, credits: true, pixels: true },
  });

  if (!kodexaUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!canAccessDevelopment(kodexaUser.rank)) {
    return NextResponse.json({ error: 'Forbidden — rank 9+ required' }, { status: 403 });
  }

  // ── Look up user in arcturus_dev by email ─────────────────────────────────
  // Identity key: mail (same as arcturus-sync pattern — NEVER user_id from client)
  const arcturusDevUsers = await arcturusDevDb.$queryRawUnsafe<ArcturusDevUser[]>(
    'SELECT id, credits FROM users WHERE mail = ? LIMIT 1',
    kodexaUser.email,
  );

  if (arcturusDevUsers.length === 0) {
    // Not yet synced to arcturus_dev — return kodexa_hotel values as fallback
    // (same as /api/hotel/wallet does for main)
    return NextResponse.json({
      ok:     true,
      source: 'kodexa_hotel_fallback',
      wallet: {
        credits:  kodexaUser.credits ?? 0,
        pixels:   kodexaUser.pixels  ?? 0,
        diamonds: 0,
      },
    });
  }

  const arcturusDevId = Number(arcturusDevUsers[0]!.id);
  const credits       = Number(arcturusDevUsers[0]!.credits);

  // ── Fetch currency from arcturus_dev.users_currency ───────────────────────
  // Number() coercions: mysql2 may return BigInt via $queryRawUnsafe
  const currencies = await arcturusDevDb.$queryRawUnsafe<UserCurrency[]>(
    'SELECT type, amount FROM users_currency WHERE user_id = ? AND type IN (0, 5)',
    arcturusDevId,
  );

  const pixels   = Number(currencies.find(c => Number(c.type) === 0)?.amount ?? 0);
  const diamonds = Number(currencies.find(c => Number(c.type) === 5)?.amount ?? 0);

  return NextResponse.json({
    ok:     true,
    source: 'arcturus_dev',
    wallet: { credits, pixels, diamonds },
  });
}
