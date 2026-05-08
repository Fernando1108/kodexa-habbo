import { prisma } from '@/lib/db';
import AdminMessagesClient from './AdminMessagesClient';

export const metadata = { title: 'Mensajes · Admin Kodexa' };

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const q    = sp.q ?? '';
  const take = 30;
  const skip = (page - 1) * take;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { parentId: null };
  if (q) {
    where.OR = [
      { from: { username: { contains: q } } },
      { to:   { username: { contains: q } } },
      { body: { contains: q } },
    ];
  }

  const [threads, total, totalMessages] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        from:    { select: { id: true, username: true, rank: true } },
        to:      { select: { id: true, username: true, rank: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            from: { select: { id: true, username: true } },
            to:   { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.message.count({ where }),
    prisma.message.count(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Mensajes</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          {totalMessages.toLocaleString()} mensajes totales · {total.toLocaleString()} conversaciones
        </p>
      </div>
      <AdminMessagesClient
        threads={threads.map(t => ({
          id:        t.id,
          body:      t.body,
          read:      t.read,
          createdAt: t.createdAt.toISOString(),
          from:      t.from,
          to:        t.to,
          replies:   t.replies.map(r => ({
            id:        r.id,
            body:      r.body,
            read:      r.read,
            createdAt: r.createdAt.toISOString(),
            from:      r.from,
            to:        r.to,
          })),
        }))}
        total={total}
        page={page}
        pages={Math.ceil(total / take)}
        q={q}
      />
    </div>
  );
}
