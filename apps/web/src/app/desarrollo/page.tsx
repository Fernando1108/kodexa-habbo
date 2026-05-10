import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma as db } from '@/lib/db';
import { canAccessDevelopment } from '@/lib/guards';
import HotelDesarrolloClient from '@/components/HotelDesarrolloClient';

export const metadata = { title: 'Kodexa Hotel · Desarrollo' };

export default async function DesarrolloPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const rank       = session.user.rank ?? 1;
  const devEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_HOTEL !== 'false';

  if (!devEnabled || !canAccessDevelopment(rank)) {
    redirect('/unauthorized');
  }

  const user = await db.user.findUnique({
    where:  { id: Number(session.user.id) },
    select: { username: true, look: true, credits: true, pixels: true, rank: true },
  });

  if (!user) redirect('/login');

  return (
    <HotelDesarrolloClient
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
