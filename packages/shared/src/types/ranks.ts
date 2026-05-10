export enum Rank {
  USER         = 1,
  VIP          = 2,
  HELPER       = 3,
  MODERATOR    = 4,
  GAME_MASTER  = 5,
  MANAGER      = 6,
  ADMIN        = 7,
  HOTEL_MANAGER = 8,
  DEVELOPER    = 9,
  FOUNDER      = 10,
}

export const RANK_LABELS: Record<number, string> = {
  [Rank.USER]:          'Normal',
  [Rank.VIP]:           'VIP',
  [Rank.HELPER]:        'Ayudante',
  [Rank.MODERATOR]:     'Moderador',
  [Rank.GAME_MASTER]:   'Game Master',
  [Rank.MANAGER]:       'Manager',
  [Rank.ADMIN]:         'Admin',
  [Rank.HOTEL_MANAGER]: 'Hotel Manager',
  [Rank.DEVELOPER]:     'Desarrollador',
  [Rank.FOUNDER]:       'Fundador',
};

export const RANK_COLORS: Record<number, string> = {
  [Rank.USER]:          '#94A3B8',
  [Rank.VIP]:           '#F59E0B',
  [Rank.HELPER]:        '#3B82F6',
  [Rank.MODERATOR]:     '#10B981',
  [Rank.GAME_MASTER]:   '#F97316',
  [Rank.MANAGER]:       '#EC4899',
  [Rank.ADMIN]:         '#EF4444',
  [Rank.HOTEL_MANAGER]: '#8B5CF6',
  [Rank.DEVELOPER]:     '#6366F1',
  [Rank.FOUNDER]:       '#7C3AED',
};

export const RANK_BADGES: Record<number, string> = {
  [Rank.USER]:          '',
  [Rank.VIP]:           'VIP',
  [Rank.HELPER]:        'HLP',
  [Rank.MODERATOR]:     'MOD',
  [Rank.GAME_MASTER]:   'GM',
  [Rank.MANAGER]:       'MGR',
  [Rank.ADMIN]:         'ADM',
  [Rank.HOTEL_MANAGER]: 'HM',
  [Rank.DEVELOPER]:     'DEV',
  [Rank.FOUNDER]:       'OWN',
};

/** Maps a numeric rank to a Kodexa admin badge CSS class */
export function rankBadgeClass(rank: number): string {
  if (rank >= 10) return 'badge-danger';
  if (rank === 9)  return 'badge-danger';
  if (rank === 8)  return 'badge-info';
  if (rank === 7)  return 'badge-danger';
  if (rank === 6)  return 'badge-warn';
  if (rank === 5)  return 'badge-warn';
  if (rank === 4)  return 'badge-ok';
  if (rank === 3)  return 'badge-info';
  if (rank === 2)  return 'badge-warn';
  return 'badge-mono';
}
