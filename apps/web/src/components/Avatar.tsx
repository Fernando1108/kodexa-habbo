'use client';

import { getAvatarUrl } from '@kodexa/shared';

interface AvatarProps {
  look:       string;
  size?:      's' | 'm' | 'l' | 'b';
  direction?: number;
  gesture?:   string;
  headOnly?:  boolean;
  className?: string;
  alt?:       string;
  style?:     React.CSSProperties;
}

export function Avatar({
  look,
  size      = 'm',
  direction = 2,
  gesture   = 'std',
  headOnly  = false,
  className = '',
  alt       = 'Avatar',
  style,
}: AvatarProps) {
  const src = getAvatarUrl(look, { size, direction, gesture, headOnly });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
      onError={(e) => {
        e.currentTarget.src = '/avatar-placeholder.svg';
        e.currentTarget.onerror = null;
      }}
      loading="lazy"
    />
  );
}

export function AvatarHead({
  look,
  className = '',
  alt = 'Avatar',
  style,
}: {
  look:       string;
  className?: string;
  alt?:       string;
  style?:     React.CSSProperties;
}) {
  return (
    <Avatar
      look={look}
      size="s"
      headOnly
      className={className}
      alt={alt}
      style={style}
    />
  );
}
