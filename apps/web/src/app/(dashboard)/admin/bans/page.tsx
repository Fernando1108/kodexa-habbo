import { prisma } from '@/lib/db';
import BansClient from './BansClient';

export const metadata = { title: 'Bans · Admin Kodexa' };

export default async function AdminBansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const take = 20;
  const skip = (page - 1) * take;

  const [bans, total] = await Promise.all([
    prisma.ban.findMany({
      where: { active: true },
      include: {
        user:  { select: { username: true } },
        admin: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.ban.count({ where: { active: true } }),
  ]);

  const serialized = bans.map(b => ({
    id:         b.id,
    username:   b.user.username,
    ip:         b.ip,
    type:       b.type,
    reason:     b.reason,
    bannedBy:   b.admin.username,
    expiresAt:  b.expiresAt?.toISOString() ?? null,
    createdAt:  b.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Gestión de Bans</h1>
        <p className="text-sm text-[#94A3B8] mt-1">{total} bans activos</p>
      </div>
      <BansClient bans={serialized} total={total} page={page} pages={Math.ceil(total / take)} />
    </div>
  );
}
