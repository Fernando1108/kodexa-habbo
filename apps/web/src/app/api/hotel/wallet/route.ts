import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { arcturusDb } from '@/lib/arcturus-db';

interface ArcturusUser {
  id: number;
  credits: number;
}

interface UserCurrency {
  type: number;
  amount: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch email from kodexa_hotel (source of truth for identity)
  const kodexaUser = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { email: true },
  });
  if (!kodexaUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Find matching user in arcturus_main by email (mail field)
  const arcturusUsers = await arcturusDb.$queryRawUnsafe<ArcturusUser[]>(
    'SELECT id, credits FROM users WHERE mail = ? LIMIT 1',
    kodexaUser.email,
  );

  if (arcturusUsers.length === 0) {
    // User not yet synced — return kodexa_hotel values as fallback
    const fallback = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { credits: true, pixels: true },
    });
    return NextResponse.json({
      ok: true,
      source: 'kodexa_hotel',
      wallet: {
        credits: fallback?.credits ?? 0,
        pixels:  fallback?.pixels  ?? 0,
        diamonds: 0,
      },
    });
  }

  const arcturusId = Number(arcturusUsers[0]!.id);
  const credits    = Number(arcturusUsers[0]!.credits);

  // Fetch duckets (type 0) and diamonds (type 5) from users_currency
  const currencies = await arcturusDb.$queryRawUnsafe<UserCurrency[]>(
    'SELECT type, amount FROM users_currency WHERE user_id = ? AND type IN (0, 5)',
    arcturusId,
  );

  // Number() guards: mysql2 may return INT columns as BigInt via $queryRawUnsafe
  // depending on driver version. Coerce to avoid silent === comparison failures.
  const pixels   = Number(currencies.find(c => Number(c.type) === 0)?.amount ?? 0);
  const diamonds = Number(currencies.find(c => Number(c.type) === 5)?.amount ?? 0);

  return NextResponse.json({
    ok: true,
    source: 'arcturus_main',
    wallet: { credits, pixels, diamonds },
  });
}
