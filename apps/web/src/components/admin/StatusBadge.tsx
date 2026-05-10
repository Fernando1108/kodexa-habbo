interface Props {
  status:     string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Publicado', cls: 'badge badge-ok'   },
  DRAFT:     { label: 'Borrador',  cls: 'badge badge-warn' },
  ARCHIVED:  { label: 'Archivado', cls: 'badge badge-mono' },
};

export function StatusBadge({ status, className = '' }: Props) {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'badge badge-mono' };
  return <span className={`${s.cls} ${className}`.trimEnd()}>{s.label}</span>;
}
