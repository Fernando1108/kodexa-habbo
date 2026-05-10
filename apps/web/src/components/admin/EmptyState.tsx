import type { ReactNode } from 'react';

interface Props {
  icon?:        ReactNode;
  title?:       string;
  description?: string;
  action?:      ReactNode;
  className?:   string;
}

export function EmptyState({ icon, title, description, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 opacity-30" style={{ color: 'var(--admin-text-muted)' }}>
          {icon}
        </div>
      )}
      {title && (
        <p className="font-semibold text-sm" style={{ color: 'var(--admin-text)' }}>
          {title}
        </p>
      )}
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--admin-text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
