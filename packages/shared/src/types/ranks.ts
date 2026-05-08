export enum Rank {
  NORMAL     = 1,
  VIP        = 2,
  GUIDE      = 3,
  MODERATOR  = 4,
  SENIOR_MOD = 5,
  GAMEMASTER = 6,
  ADMIN      = 7,
  DIRECTOR   = 8,
  FOUNDER    = 9,
}

export const RANK_LABELS: Record<number, string> = {
  [Rank.NORMAL]:     'Normal',
  [Rank.VIP]:        'VIP',
  [Rank.GUIDE]:      'Guía',
  [Rank.MODERATOR]:  'Moderador',
  [Rank.SENIOR_MOD]: 'Senior Mod',
  [Rank.GAMEMASTER]: 'Gamemaster',
  [Rank.ADMIN]:      'Admin',
  [Rank.DIRECTOR]:   'Director',
  [Rank.FOUNDER]:    'Fundador',
};

export const RANK_COLORS: Record<number, string> = {
  [Rank.NORMAL]:     '#94A3B8',
  [Rank.VIP]:        '#F59E0B',
  [Rank.GUIDE]:      '#3B82F6',
  [Rank.MODERATOR]:  '#10B981',
  [Rank.SENIOR_MOD]: '#F97316',
  [Rank.GAMEMASTER]: '#EC4899',
  [Rank.ADMIN]:      '#EF4444',
  [Rank.DIRECTOR]:   '#8B5CF6',
  [Rank.FOUNDER]:    '#7C3AED',
};

export const RANK_BADGES: Record<number, string> = {
  [Rank.NORMAL]:     '',
  [Rank.VIP]:        'VIP',
  [Rank.GUIDE]:      'AMB',
  [Rank.MODERATOR]:  'MOD',
  [Rank.SENIOR_MOD]: 'SMOD',
  [Rank.GAMEMASTER]: 'GM',
  [Rank.ADMIN]:      'ADM',
  [Rank.DIRECTOR]:   'DIR',
  [Rank.FOUNDER]:    'OWN',
};

/** Maps a numeric rank to a Kodexa admin badge CSS class */
export function rankBadgeClass(rank: number): string {
  if (rank >= 9) return 'badge-danger';
  if (rank === 8) return 'badge-info';
  if (rank === 7) return 'badge-danger';
  if (rank === 6) return 'badge-warn';
  if (rank === 5) return 'badge-warn';
  if (rank === 4) return 'badge-ok';
  if (rank === 3) return 'badge-info';
  if (rank === 2) return 'badge-warn';
  return 'badge-mono';
}
