import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessDevelopment } from '@/lib/guards';
import { isArcturusDevReady, syncUserToArcturusDev, writeArcturusDevTicket } from '@/lib/arcturus-dev-sync';

export async function POST() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Fresh rank from DB — never trust JWT rank for privileged endpoints ─────
  const userId = parseInt(session.user.id);
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, username: true, email: true, rank: true, look: true, motto: true, credits: true, pixels: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!canAccessDevelopment(user.rank)) {
    return NextResponse.json({ error: 'Forbidden — rank 9+ required' }, { status: 403 });
  }

  // ── Check arcturus_dev is bootstrapped ────────────────────────────────────
  const devReady = await isArcturusDevReady();
  if (!devReady) {
    return NextResponse.json(
      { error: 'arcturus_dev is not bootstrapped. Run MP-015A bootstrap before using dev SSO.' },
      { status: 503 },
    );
  }

  // ── Generate dev ticket — distinct format from main ticket ────────────────
  // Main ticket:  kodexa_<id>_<uuid32>
  // Dev ticket:   kodexa_dev_<id>_<uuid32>
  const uuid       = crypto.randomUUID().replace(/-/g, '');
  const devTicket  = `kodexa_dev_${userId}_${uuid}`.slice(0, 64);

  // ── Sync user to arcturus_dev (never touches arcturus_main) ───────────────
  const arcturusDevId = await syncUserToArcturusDev({
    id:       user.id,
    username: user.username,
    email:    user.email,
    rank:     user.rank,
    look:     user.look  ?? '',
    motto:    user.motto ?? '',
    credits:  user.credits,
    pixels:   user.pixels,
  });

  await writeArcturusDevTicket(arcturusDevId, devTicket);

  // ── Build Nitro Dev URL ───────────────────────────────────────────────────
  const nitroDevUrl = process.env.NEXT_PUBLIC_NITRO_DEV_URL ?? 'http://localhost:8082';
  const hotelDevUrl = `${nitroDevUrl}?sso=${encodeURIComponent(devTicket)}`;

  return NextResponse.json({ ok: true, ticket: devTicket, nitroUrl: hotelDevUrl });
}
