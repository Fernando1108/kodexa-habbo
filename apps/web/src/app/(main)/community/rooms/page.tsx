import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Home, Users, Star } from 'lucide-react';
import { getAvatarUrl } from '@kodexa/shared';

export const metadata = { title: 'Salas Populares · Kodexa Hotel' };

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';

  const rooms = await prisma.room.findMany({
    where: {
      state: 'open',
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: [{ score: 'desc' }],
    take: 50,
    include: { owner: { select: { username: true, look: true } } },
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Home size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC]">Salas Populares</h1>
            <p className="text-xs text-[#94A3B8]">{rooms.length} salas encontradas</p>
          </div>
        </div>
        {/* Search */}
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar sala…"
            className="px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-primary/50 w-48"
          />
          <button type="submit" className="btn btn-primary py-2 px-4 text-sm">Buscar</button>
        </form>
      </div>

      {rooms.length === 0 ? (
        <div className="card text-center py-16">
          <Home size={40} className="text-[#334155] mx-auto mb-3" />
          <p className="text-[#94A3B8]">No hay salas públicas disponibles.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <div key={room.id} className="card flex flex-col gap-3">
              {/* Room gradient header */}
              <div className="h-20 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,rgba(0,212,170,.08),rgba(124,58,237,.08))' }}>
                <Home size={32} className="text-primary/20" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-[#F8FAFC] text-sm mb-1 line-clamp-1">{room.name}</h3>
                {room.description && (
                  <p className="text-xs text-[#94A3B8] line-clamp-2 mb-2 leading-relaxed">{room.description}</p>
                )}

                {/* Owner */}
                <div className="flex items-center gap-2 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAvatarUrl(room.owner.look, { size: 's', headOnly: true })}
                    alt={room.owner.username}
                    className="w-6 h-6 rounded-full bg-[#0F172A]"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <Link href={`/community/profiles/${room.owner.username}`}
                    className="text-xs text-[#94A3B8] hover:text-primary transition-colors">
                    {room.owner.username}
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[11px] text-[#475569]">
                  <span className="flex items-center gap-1"><Users size={10} />{room.maxUsers} máx.</span>
                  <span className="flex items-center gap-1"><Star size={10} />{room.score} pts</span>
                </div>
              </div>

              <Link href={`/hotel?room=${room.id}`}
                className="btn btn-outline py-2 px-4 text-sm text-center mt-auto cursor-pointer">
                Visitar sala
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
