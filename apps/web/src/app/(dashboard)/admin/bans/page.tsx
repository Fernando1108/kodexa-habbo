import { prisma } from '@/lib/db';
import BansClient from './BansClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
    id:        b.id,
    username:  b.user.username,
    ip:        b.ip,
    type:      b.type,
    reason:    b.reason,
    bannedBy:  b.admin.username,
    expiresAt: b.expiresAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Moderación"
        title="Baneos"
        subtitle={`${total} ${total === 1 ? 'ban activo' : 'bans activos'}`}
      />
      <BansClient bans={serialized} total={total} page={page} pages={Math.ceil(total / take)} />
    </>
  );
}
