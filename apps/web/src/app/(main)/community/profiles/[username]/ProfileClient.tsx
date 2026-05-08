'use client';

import { Coins, Star, Trophy, Home, Circle } from 'lucide-react';
import { RANK_LABELS, RANK_COLORS, getBadgeUrl } from '@kodexa/shared';
import { Avatar } from '@/components/Avatar';
import type { ProfileUser } from './page';

interface Props {
  user: ProfileUser;
}

export function ProfileClient({ user }: Props) {
  const rankLabel = RANK_LABELS[user.rank] ?? 'Normal';
  const rankColor = RANK_COLORS[user.rank] ?? '#94A3B8';

  const memberSince = new Date(user.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
  });

  const slottedBadges = user.badges.filter((b) => b.slotNumber > 0);
  const unslottedBadges = user.badges.filter((b) => b.slotNumber === 0);
  const orderedBadges = [...slottedBadges, ...unslottedBadges];

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      {/* Hero */}
      <section className="border-b border-[#334155] bg-[#0F172A] px-4 py-10">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-8">
          {/* Avatar */}
          <div className="shrink-0">
            <Avatar
              look={user.look}
              size="l"
              direction={2}
              alt={user.username}
              style={{ height: 120 }}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            {/* Username + online */}
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <h1 className="text-3xl font-bold text-[#F8FAFC]">{user.username}</h1>
              <Circle
                size={10}
                fill={user.online ? '#10B981' : '#334155'}
                className={user.online ? 'text-[#10B981]' : 'text-[#334155]'}
              />
            </div>

            {/* Rank badge */}
            <div className="flex justify-center sm:justify-start">
              <span
                className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${rankColor}22`,
                  color: rankColor,
                  border: `1px solid ${rankColor}55`,
                }}
              >
                {rankLabel}
              </span>
            </div>

            {/* Motto */}
            {user.motto && (
              <p className="text-sm text-[#94A3B8] italic">&ldquo;{user.motto}&rdquo;</p>
            )}

            {/* Member since */}
            <p className="text-xs text-[#94A3B8]">Miembro desde {memberSince}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* Stats row */}
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Coins size={18} className="text-[#F59E0B]" />}
              label="Créditos"
              value={user.credits.toLocaleString('es-ES')}
            />
            <StatCard
              icon={<Star size={18} className="text-[#00D4AA]" />}
              label="Nivel"
              value={String(user.userLevel?.level ?? 1)}
            />
            <StatCard
              icon={<Trophy size={18} className="text-[#7C3AED]" />}
              label="XP"
              value={(user.userLevel?.experience ?? 0).toLocaleString('es-ES')}
            />
            <StatCard
              icon={<Star size={18} className="text-[#F59E0B]" />}
              label="Reputación"
              value={String(user.reputation?.score ?? 0)}
            />
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#F8FAFC]">Insignias</h2>
          {orderedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {orderedBadges.map((badge) => (
                <div
                  key={badge.badgeCode}
                  title={badge.badgeCode}
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E293B] p-1"
                >
                  <img
                    src={getBadgeUrl(badge.badgeCode)}
                    alt={badge.badgeCode}
                    width={40}
                    height={40}
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">Sin insignias</p>
          )}
        </section>

        {/* Rooms */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#F8FAFC]">Habitaciones</h2>
          {user.ownedRooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {user.ownedRooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-lg bg-[#1E293B] p-4 flex flex-col gap-2 border border-[#334155] hover:border-[#00D4AA] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Home size={15} className="shrink-0 text-[#94A3B8]" />
                      <span className="truncate font-medium text-[#F8FAFC] text-sm">{room.name}</span>
                    </div>
                    <RoomStateBadge state={room.state} />
                  </div>
                  {room.description && (
                    <p className="text-xs text-[#94A3B8] line-clamp-2">{room.description}</p>
                  )}
                  <div className="mt-auto flex items-center gap-1 text-xs text-[#94A3B8]">
                    <Trophy size={12} />
                    <span>{room.score.toLocaleString('es-ES')} pts</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">Sin habitaciones públicas</p>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#1E293B] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[#94A3B8]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold text-[#F8FAFC]">{value}</span>
    </div>
  );
}

function RoomStateBadge({ state }: { state: string }) {
  const isOpen = state === 'open';
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isOpen
          ? 'bg-[#10B98122] text-[#10B981] border border-[#10B98155]'
          : 'bg-[#F59E0B22] text-[#F59E0B] border border-[#F59E0B55]'
      }`}
    >
      {isOpen ? 'Abierta' : 'Cerrada'}
    </span>
  );
}
