import { RANK_LABELS, rankBadgeClass } from '@kodexa/shared';

interface Props {
  rank:       number;
  className?: string;
}

export function RankBadge({ rank, className = '' }: Props) {
  const label = RANK_LABELS[rank] ?? 'Normal';
  const cls   = rankBadgeClass(rank);
  return <span className={`badge ${cls} ${className}`.trimEnd()}>{label}</span>;
}
