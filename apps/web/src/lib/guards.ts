import { RANK_LABELS } from '@kodexa/shared';

// ---------------------------------------------------------------------------
// Rank predicates — canonical source for page-level server components
// Values mirror middleware.ts (kept in sync manually — middleware runs on Edge)
// ---------------------------------------------------------------------------

/** Rank 1+ — every authenticated user */
export function isUser(rank: number): boolean         { return rank >= 1; }

/** Rank 2+ — VIP members */
export function isVip(rank: number): boolean          { return rank >= 2; }

/** Rank 3+ — Community helpers */
export function isHelper(rank: number): boolean       { return rank >= 3; }

/** Rank 4+ — Moderators */
export function isModerator(rank: number): boolean    { return rank >= 4; }

/** Rank 5+ — Game Masters */
export function isGameMaster(rank: number): boolean   { return rank >= 5; }

/** Rank 6+ — Managers */
export function isManager(rank: number): boolean      { return rank >= 6; }

/** Rank 7+ — Administrators */
export function isAdmin(rank: number): boolean        { return rank >= 7; }

/** Rank 8+ — Hotel Managers */
export function isHotelManager(rank: number): boolean { return rank >= 8; }

/** Rank 9+ — Developers */
export function isDeveloper(rank: number): boolean    { return rank >= 9; }

/** Rank 10 — Founder only */
export function isFounder(rank: number): boolean      { return rank >= 10; }

// ---------------------------------------------------------------------------
// Route-level access guards
// ---------------------------------------------------------------------------

/** /admin — rank 7+ */
export function canAccessAdmin(rank: number): boolean       { return rank >= 7; }

/** /desarrollo — rank 9+ (developer or above) */
export function canAccessDevelopment(rank: number): boolean { return rank >= 9; }

/** /hotel-beta — rank 10 (founder only) */
export function canAccessBeta(rank: number): boolean        { return rank >= 10; }

// ---------------------------------------------------------------------------
// Rank metadata helpers
// ---------------------------------------------------------------------------

/** Human-readable label for a rank number */
export function getRankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? 'Normal';
}

/** Returns the numeric rank level as-is (useful for comparisons in JSX) */
export function getRankLevel(rank: number): number {
  return rank;
}
