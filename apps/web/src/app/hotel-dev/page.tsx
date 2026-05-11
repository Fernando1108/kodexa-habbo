import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma as db } from '@/lib/db';
import { canAccessDevelopment } from '@/lib/guards';
import HotelDevClient from '@/components/HotelDevClient';

export const metadata = { title: 'Kodexa Hotel · Arcturus Dev' };

export default async function HotelDevPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const devEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_HOTEL !== 'false';

  // Fresh DB rank — same pattern as /hotel and /desarrollo
  const user = await db.user.findUnique({
    where:  { id: Number(session.user.id) },
    select: { username: true, look: true, credits: true, pixels: true, rank: true },
  });

  if (!user) redirect('/login');

  if (!devEnabled || !canAccessDevelopment(user.rank)) {
    redirect('/unauthorized');
  }

  return (
    <HotelDevClient
      user={{
        username: user.username,
        look:     user.look    ?? '',
        credits:  user.credits ?? 0,
        pixels:   user.pixels  ?? 0,
        rank:     user.rank    ?? 1,
      }}
    />
  );
}
