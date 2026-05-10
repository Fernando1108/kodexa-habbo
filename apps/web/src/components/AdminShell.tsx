'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar  from '@/components/admin/AdminTopbar';

interface AdminUser {
  username: string;
  rank:     number;
  look?:    string;
}

interface Props {
  user:     AdminUser;
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: Props) {
  // Default to 'light'; read localStorage after mount to avoid SSR hydration mismatch.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('kodexa-admin-theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark') setTheme('dark');
    const savedCollapse = localStorage.getItem('admin_sb_collapsed') === 'true';
    setCollapsed(savedCollapse);
  }, []);

  function toggleTheme() {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('kodexa-admin-theme', next);
      return next;
    });
  }

  function toggleCollapse() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sb_collapsed', String(next));
      return next;
    });
  }

  return (
    <div
      className="admin-shell"
      data-theme={theme}
      style={{
        background: 'var(--admin-bg)',
        color:      'var(--admin-text)',
        minHeight:  '100vh',
        display:    'flex',
      }}
    >
      <AdminSidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main
          className="flex-1 px-5 lg:px-7 py-6"
          style={{ maxWidth: 1400, width: '100%', margin: '0 auto' }}
        >
          {children}
        </main>

        <footer
          className="px-7 py-4 text-xs flex items-center justify-between font-mono"
          style={{ color: 'var(--admin-text-subtle)', borderTop: '1px solid var(--admin-border)' }}
        >
          <span>© 2025 Kodexa Hotel · admin v0.9.0-beta</span>
          <span className="flex items-center gap-1.5">
            <span className="pulse-dot" /> servers operational
          </span>
        </footer>
      </div>
    </div>
  );
}
