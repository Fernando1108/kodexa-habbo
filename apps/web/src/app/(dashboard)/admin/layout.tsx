import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/AdminShell';

export const metadata = { title: 'Admin — Kodexa Hotel' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.rank < 7) redirect('/hotel');

  return (
    <AdminShell user={{ username: session.user.username, rank: session.user.rank, look: session.user.look }}>
      {children}
    </AdminShell>
  );
}
