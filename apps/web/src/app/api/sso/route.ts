import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncUserToArcturus, writeArcturusTicket } from '@/lib/arcturus-sync';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Fetch full user from kodexa_hotel (source of truth)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, rank: true, look: true, motto: true, credits: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Generate ticket — must fit arcturus VARCHAR(64)
  const uuid = crypto.randomUUID().replace(/-/g, '');
  const ticket = `kodexa_${userId}_${uuid}`.slice(0, 64);

  // Write ticket to kodexa_hotel
  await prisma.user.update({
    where: { id: userId },
    data: { authTicket: ticket },
  });

  // Sync user to arcturus_main and write ticket there too
  const arcturusId = await syncUserToArcturus({
    id: user.id,
    username: user.username,
    email: user.email,
    rank: user.rank,
    look: user.look ?? '',
    motto: user.motto ?? '',
    credits: user.credits,
  });
  await writeArcturusTicket(arcturusId, ticket);

  return NextResponse.json({ ticket });
}
