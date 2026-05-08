import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const metadata = { title: 'Configuración · Kodexa Hotel' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where:  { id: Number(session.user.id) },
    select: { username: true, email: true, motto: true, online: true },
  });
  if (!user) redirect('/login');

  return <SettingsClient user={user} />;
}
