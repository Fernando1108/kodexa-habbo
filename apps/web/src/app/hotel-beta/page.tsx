import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma as db } from '@/lib/db';
import { isFounder } from '@/lib/guards';
import HotelBetaClient from '@/components/HotelBetaClient';

export const metadata = { title: 'Kodexa Hotel · Beta Privada' };

export default async function HotelBetaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const rank = session.user.rank ?? 1;
  const betaEnabled = process.env.NEXT_PUBLIC_ENABLE_BETA_HOTEL !== 'false';

  if (!betaEnabled || !isFounder(rank)) {
    redirect('/unauthorized');
  }

  const user = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { username: true, look: true, credits: true, pixels: true, rank: true },
  });

  if (!user) redirect('/login');

  return (
    <HotelBetaClient
      user={{
        username: user.username,
        look:     user.look     ?? '',
        credits:  user.credits  ?? 0,
        pixels:   user.pixels   ?? 0,
        rank:     user.rank     ?? 1,
      }}
    />
  );
}
