import { prisma } from '@/lib/db';
import BadgesClient from './BadgesClient';

export const metadata = { title: 'Badges · Admin Kodexa' };

export default async function AdminBadgesPage() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, rank: true },
    orderBy: { username: 'asc' },
    take: 100,
  });

  const badgeCounts = await prisma.userBadge.groupBy({
    by: ['badgeCode'],
    _count: { badgeCode: true },
    orderBy: { _count: { badgeCode: 'desc' } },
    take: 20,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Gestión de Badges</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Dar y revocar badges a usuarios</p>
      </div>
      <BadgesClient users={users} topBadges={badgeCounts.map(b => ({ code: b.badgeCode, count: b._count.badgeCode }))} />
    </div>
  );
}
