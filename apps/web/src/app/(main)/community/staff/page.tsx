import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { RANK_LABELS, RANK_COLORS, getAvatarUrl } from '@kodexa/shared';

export const metadata = { title: 'Equipo · Kodexa Hotel' };

const RANK_ORDER = [9, 8, 7, 6, 5, 4, 3];

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Hace ${days}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default async function StaffPage() {
  const staff = await prisma.user.findMany({
    where: { rank: { gte: 3 } },
    orderBy: [{ rank: 'desc' }, { username: 'asc' }],
    select: { id: true, username: true, look: true, motto: true, rank: true, lastLogin: true, online: true },
  });

  const grouped = RANK_ORDER.reduce<Record<number, typeof staff>>((acc, rank) => {
    const members = staff.filter(u => u.rank === rank);
    if (members.length > 0) acc[rank] = members;
    return acc;
  }, {});

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <Users size={18} className="text-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Equipo de Kodexa</h1>
          <p className="text-xs text-[#94A3B8]">{staff.length} miembros del equipo</p>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="text-[#334155] mx-auto mb-3" />
          <p className="text-[#94A3B8]">El equipo se está formando. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {RANK_ORDER.map((rank) => {
            const members = grouped[rank];
            if (!members) return null;
            const rankColor = (RANK_COLORS as Record<number, string>)[rank] ?? '#94A3B8';
            const rankLabel = (RANK_LABELS as Record<number, string>)[rank] ?? `Rango ${rank}`;
            return (
              <section key={rank}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${rankColor}40, transparent)` }} />
                  <span className="text-xs font-mono uppercase tracking-widest font-bold" style={{ color: rankColor }}>
                    {rankLabel} — {members.length}
                  </span>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${rankColor}40, transparent)` }} />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {members.map((member) => (
                    <Link key={member.id} href={`/community/profiles/${member.username}`}
                      className="card flex flex-col items-center text-center p-5 cursor-pointer hover:border-primary/20 transition-colors group">
                      {/* Avatar */}
                      <div className="relative mb-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#0F172A] border-2"
                          style={{ borderColor: rankColor + '60' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getAvatarUrl(member.look, { size: 's', direction: 2, headOnly: true })}
                            alt={member.username}
                            className="w-full h-full"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        {member.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#0F172A]" />
                        )}
                      </div>

                      <p className="font-semibold text-sm text-[#F8FAFC] group-hover:text-primary transition-colors">{member.username}</p>
                      <p className="text-[11px] font-medium mb-1" style={{ color: rankColor }}>{rankLabel}</p>
                      {member.motto && (
                        <p className="text-[10px] text-[#475569] line-clamp-2 italic mb-2">"{member.motto}"</p>
                      )}
                      <p className="text-[10px] text-[#334155]">{timeAgo(new Date(member.lastLogin))}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
