import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type IconColor = 'primary' | 'purple' | 'amber' | 'green';
type TrendDir  = 'up' | 'down' | 'neutral';

interface Trend {
  direction: TrendDir;
  label:     string;
}

interface Props {
  icon:       ReactNode;
  iconColor?: IconColor;
  value:      string | number;
  label:      string;
  trend?:     Trend;
  live?:      boolean;
  className?: string;
}

const ICON_STYLES: Record<IconColor, { bg: string; border: string; color: string }> = {
  primary: { bg: 'rgba(0,212,170,.15)',  border: 'rgba(0,212,170,.35)',  color: '#00D4AA' },
  purple:  { bg: 'rgba(124,58,237,.15)', border: 'rgba(124,58,237,.35)', color: '#7C3AED' },
  amber:   { bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.35)', color: '#F59E0B' },
  green:   { bg: 'rgba(16,185,129,.15)', border: 'rgba(16,185,129,.35)', color: '#10B981' },
};

const TREND_ICON: Record<TrendDir, ReactNode> = {
  up:      <TrendingUp   className="w-3 h-3" />,
  down:    <TrendingDown className="w-3 h-3" />,
  neutral: <Minus        className="w-3 h-3" />,
};

const TREND_COLOR: Record<TrendDir, string> = {
  up:      '#10B981',
  down:    '#EF4444',
  neutral: '#94A3B8',
};

export function AdminStatCard({ icon, iconColor = 'primary', value, label, trend, live, className = '' }: Props) {
  const s = ICON_STYLES[iconColor];
  return (
    <div className={`card metric ${className}`}>
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-none"
          style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
        >
          {icon}
        </div>
        {live && <span className="pulse-dot" />}
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
        {value}
      </div>
      <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>
        {label}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: TREND_COLOR[trend.direction] }}>
          {TREND_ICON[trend.direction]}
          <span className="font-mono">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
