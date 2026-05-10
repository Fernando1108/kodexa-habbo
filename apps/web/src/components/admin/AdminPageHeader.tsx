import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title:    ReactNode;
  subtitle?: string;
  actions?:  ReactNode;
  className?: string;
}

export function AdminPageHeader({ eyebrow, title, subtitle, actions, className = '' }: Props) {
  return (
    <div className={`flex items-end justify-between flex-wrap gap-3 mb-6 ${className}`}>
      <div>
        {eyebrow && <div className="admin-eyebrow">{eyebrow}</div>}
        <h1 className="admin-page-title">{title}</h1>
        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
