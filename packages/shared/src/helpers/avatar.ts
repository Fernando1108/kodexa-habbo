export interface AvatarOptions {
  /** 's' | 'm' | 'l' | 'b' — default 'm' */
  size?:      's' | 'm' | 'l' | 'b';
  direction?: number;
  gesture?:   string;
  action?:    string;
  headOnly?:  boolean;
}

/**
 * Primary avatar URL — uses Habbo's public imager.
 * Falls back gracefully; switch to getLocalAvatarUrl when the local imager is ready.
 */
export function getAvatarUrl(look: string, options: AvatarOptions = {}): string {
  const {
    size      = 'm',
    direction = 2,
    gesture   = 'std',
    action    = 'std',
    headOnly  = false,
  } = options;

  const base   = 'https://www.habbo.com/habbo-imaging/avatarimage';
  const params = new URLSearchParams({
    figure:         look,
    size,
    direction:      String(direction),
    head_direction: String(direction),
    gesture,
    action,
  });

  if (headOnly) params.set('headonly', '1');

  return `${base}?${params.toString()}`;
}

/**
 * Local nitro-imager URL — use this when the local imager is healthy.
 * Base URL read from NEXT_PUBLIC_IMAGER_URL env var, falls back to localhost:1338.
 */
export function getLocalAvatarUrl(look: string, options: AvatarOptions = {}): string {
  const {
    size      = 'm',
    direction = 2,
    gesture   = 'std',
    action    = 'std',
    headOnly  = false,
  } = options;

  const base =
    (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_IMAGER_URL']) ||
    'http://localhost:1338';

  const params = new URLSearchParams({
    figure:         look,
    size,
    direction:      String(direction),
    head_direction: String(direction),
    gesture,
    action,
  });

  if (headOnly) params.set('headonly', '1');

  return `${base}/?${params.toString()}`;
}

/**
 * Badge image URL.
 * Pass a badge code like 'ADM' or 'b15113s24114'.
 */
export function getBadgeUrl(badgeCode: string, imagerBaseUrl?: string): string {
  const base =
    imagerBaseUrl ||
    (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_IMAGER_URL']) ||
    'http://localhost:1338';

  return `${base}/?badge=${encodeURIComponent(badgeCode)}&size=s`;
}
