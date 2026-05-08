import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma as db } from '@/lib/db';
import HotelClient from '@/components/HotelClient';

export const metadata = { title: 'Kodexa Hotel · Entrar' };

export default async function HotelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { username: true, look: true, credits: true, pixels: true, rank: true },
  });

  if (!user) redirect('/login');

  return (
    <HotelClient
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
