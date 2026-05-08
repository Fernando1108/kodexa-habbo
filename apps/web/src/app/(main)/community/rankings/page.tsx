import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Trophy, Medal, Crown } from 'lucide-react';
import { RANK_LABELS, RANK_COLORS, getAvatarUrl } from '@kodexa/shared';

export const metadata = { title: 'Rankings · Kodexa Hotel' };

const TABS = [
  { key: 'richest',  label: 'Más Ricos',     icon: <Trophy size={14} /> },
  { key: 'active',   label: 'Más Activos',   icon: <Medal  size={14} /> },
  { key: 'rooms',    label: 'Mejores Salas', icon: <Crown  size={14} /> },
  { key: 'level',    label: 'Nivel Más Alto', icon: <Trophy size={14} /> },
];

function MedalIcon({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-[#F59E0B] font-bold text-base">🥇</span>;
  if (pos === 1) return <span className="text-[#94A3B8] font-bold text-base">🥈</span>;
  if (pos === 2) return <span className="text-[#CD7F32] font-bold text-base">🥉</span>;
  return <span className="text-[#475569] font-mono text-sm w-5 text-center">#{pos + 1}</span>;
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? 'richest';

  let entries: { id: number | string; username: string; look?: string; rank?: number; value: string; label: string }[] = [];

  if (tab === 'richest') {
    const users = await prisma.user.findMany({
      orderBy: { credits: 'desc' },
      take: 25,
      select: { id: true, username: true, look: true, rank: true, credits: true },
    });
    entries = users.map(u => ({
      id: u.id, username: u.username, look: u.look, rank: u.rank,
      value: u.credits.toLocaleString(), label: 'créditos',
    }));
  } else if (tab === 'active') {
    const users = await prisma.user.findMany({
      orderBy: { lastLogin: 'desc' },
      take: 25,
      select: { id: true, username: true, look: true, rank: true, lastLogin: true },
    });
    entries = users.map(u => ({
      id: u.id, username: u.username, look: u.look, rank: u.rank,
      value: new Date(u.lastLogin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      label: 'última conexión',
    }));
  } else if (tab === 'rooms') {
    const rooms = await prisma.room.findMany({
      orderBy: { score: 'desc' },
      take: 25,
      select: { id: true, name: true, ownerName: true, score: true },
    });
    entries = rooms.map(r => ({
      id: r.id, username: r.name, rank: undefined,
      value: r.score.toString(), label: `por ${r.ownerName}`,
    }));
  } else if (tab === 'level') {
    const levels = await prisma.kxUserLevel.findMany({
      orderBy: [{ level: 'desc' }, { experience: 'desc' }],
      take: 25,
      include: { user: { select: { id: true, username: true, look: true, rank: true } } },
    });
    entries = levels.map(l => ({
      id: l.userId, username: l.user.username, look: l.user.look, rank: l.user.rank,
      value: `Nv. ${l.level}`, label: `${l.experience.toLocaleString()} XP`,
    }));
  }

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-1">Rankings</h1>
        <p className="text-sm text-[#94A3B8]">Los mejores jugadores de Kodexa Hotel</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 justify-center mb-8 flex-wrap">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-[#062A22]'
                : 'bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155]'
            }`}
          >
            {t.icon}{t.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy size={40} className="text-[#334155] mx-auto mb-3" />
          <p className="text-[#94A3B8]">No hay datos disponibles aún.</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {topThree.map((e, i) => {
              const rankColor = e.rank ? ((RANK_COLORS as Record<number, string>)[e.rank] ?? '#94A3B8') : '#94A3B8';
              const rankLabel = e.rank ? ((RANK_LABELS as Record<number, string>)[e.rank] ?? '') : '';
              return (
                <div key={e.id} className={`card text-center relative ${i === 0 ? 'border-primary/30' : ''}`}>
                  <div className="absolute top-3 right-3 text-xl">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  {tab !== 'rooms' && e.look ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getAvatarUrl(e.look, { size: 's', direction: 2 })}
                      alt={e.username}
                      className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#0F172A]"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Trophy size={20} className="text-primary" />
                    </div>
                  )}
                  <p className="font-semibold text-sm text-[#F8FAFC] mb-0.5">
                    {tab !== 'rooms' ? (
                      <Link href={`/community/profiles/${e.username}`} className="hover:text-primary transition-colors">
                        {e.username}
                      </Link>
                    ) : e.username}
                  </p>
                  {rankLabel && <p className="text-[10px] mb-1" style={{ color: rankColor }}>{rankLabel}</p>}
                  <p className="text-lg font-bold text-primary">{e.value}</p>
                  <p className="text-[10px] text-[#475569]">{e.label}</p>
                </div>
              );
            })}
          </div>

          {/* Rest list */}
          {rest.length > 0 && (
            <div className="card divide-y divide-[#1f2b41]">
              {rest.map((e, i) => {
                const rankColor = e.rank ? ((RANK_COLORS as Record<number, string>)[e.rank] ?? '#94A3B8') : '#94A3B8';
                return (
                  <div key={e.id} className="flex items-center gap-4 py-3 px-1">
                    <MedalIcon pos={i + 3} />
                    {tab !== 'rooms' && e.look ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={getAvatarUrl(e.look, { size: 's', direction: 2 })}
                        alt={e.username}
                        className="w-8 h-8 rounded-full bg-[#0F172A]"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center">
                        <Trophy size={12} className="text-[#475569]" />
                      </div>
                    )}
                    <span className="flex-1 text-sm font-medium text-[#F8FAFC]">
                      {tab !== 'rooms' ? (
                        <Link href={`/community/profiles/${e.username}`} className="hover:text-primary transition-colors">
                          {e.username}
                        </Link>
                      ) : e.username}
                    </span>
                    {e.rank && (
                      <span className="text-[10px] font-mono hidden sm:block" style={{ color: rankColor }}>
                        {(RANK_LABELS as Record<number, string>)[e.rank] ?? ''}
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#F8FAFC]">{e.value}</p>
                      <p className="text-[10px] text-[#475569]">{e.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
