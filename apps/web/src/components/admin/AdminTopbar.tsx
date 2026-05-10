'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  ChevronRight, Search, Bell, ChevronDown, X,
  LayoutDashboard, Settings, User, LogOut,
  UserPlus, Ban, AlertTriangle,
} from 'lucide-react';
import { RANK_LABELS } from '@kodexa/shared';
import { Avatar, AvatarHead } from '@/components/Avatar';
import { ThemeToggle } from './ThemeToggle';

interface TopbarUser {
  username: string;
  rank:     number;
  look?:    string;
}

interface Notif {
  id:   string;
  type: 'register' | 'ban' | 'alert';
  text: string;
  href: string;
  time: string;
}

interface Props {
  user:          TopbarUser;
  theme:         'light' | 'dark';
  onToggleTheme: () => void;
}

const CRUMBS: Record<string, string> = {
  '/admin':             'Dashboard',
  '/admin/users':       'Usuarios',
  '/admin/rooms':       'Salas',
  '/admin/news':        'Noticias',
  '/admin/settings':    'Configuración',
  '/admin/logs':        'Logs',
  '/admin/bans':        'Bans',
  '/admin/wordfilter':  'Wordfilter',
  '/admin/permissions': 'Permisos',
  '/admin/badges':      'Badges',
  '/admin/alerts':      'Alertas',
  '/admin/messages':    'Mensajes',
};

const NOTIF_ICONS: Record<Notif['type'], React.ReactNode> = {
  register: <UserPlus      size={13} className="text-[#3B82F6]" />,
  ban:      <Ban           size={13} className="text-[#EF4444]" />,
  alert:    <AlertTriangle size={13} className="text-[#F59E0B]" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function initials(s: string) {
  return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
}

export default function AdminTopbar({ user, theme, onToggleTheme }: Props) {
  const pathname = usePathname();
  const crumb    = CRUMBS[pathname] ?? 'Panel';
  const rk       = RANK_LABELS[user.rank] ?? 'Normal';
  const ini      = initials(user.username);

  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifs,       setNotifs]       = useState<Notif[]>([]);
  const [unread,       setUnread]       = useState(0);

  const notifRef    = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/notifications')
      .then(r => r.json())
      .then((d: { notifications?: Notif[] }) => {
        if (d.notifications) {
          setNotifs(d.notifications);
          setUnread(d.notifications.length);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))  setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const dropdownStyle = {
    background: 'var(--admin-surface)',
    border:     '1px solid var(--admin-border)',
  } as const;

  return (
    <header className="topbar sticky top-0 z-30 px-5 lg:px-7 flex items-center gap-4">
      {/* Breadcrumb */}
      <div className="crumb hidden md:flex items-center gap-2">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" style={{ color: 'var(--admin-text-subtle)' }} />
        <b>{crumb}</b>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex relative items-center" style={{ width: 260 }}>
          <Search
            className="w-4 h-4 pointer-events-none absolute"
            style={{ left: '.7rem', color: 'var(--admin-text-subtle)', zIndex: 1 }}
          />
          <input
            className="inp"
            style={{ paddingLeft: '2.3rem', paddingRight: '4rem' }}
            placeholder="Buscar usuarios, salas…"
          />
          <span
            className="absolute right-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: 'var(--admin-text-subtle)', border: '1px solid var(--admin-border)' }}
          >⌘K</span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className="icon-btn relative"
            onClick={() => { setNotifOpen(v => !v); setUnread(0); }}
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: '#EF4444', outline: '2px solid var(--admin-bg)' }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl overflow-hidden"
              style={{ ...dropdownStyle, zIndex: 100 }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--admin-border)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
                  Notificaciones
                </span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                    Sin notificaciones
                  </p>
                ) : notifs.map(n => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors"
                    style={{ borderBottom: '1px solid var(--admin-border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--admin-surface-soft)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-none mt-0.5"
                      style={{ background: 'var(--admin-surface-soft)', border: '1px solid var(--admin-border)' }}
                    >
                      {NOTIF_ICONS[n.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: 'var(--admin-text)' }}>{n.text}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{timeAgo(n.time)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--admin-border)' }}>
                <Link
                  href="/admin/logs"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--admin-primary)' }}
                >
                  Ver todos los logs →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative ml-2" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors cursor-pointer"
            style={{ borderLeft: '1px solid var(--admin-border)', paddingLeft: '0.75rem' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-surface-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex-none"
              style={{ background: 'var(--admin-surface-soft)', outline: '2px solid var(--admin-border)', outlineOffset: '1px' }}
            >
              {user.look ? (
                <AvatarHead look={user.look} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}
                >{ini}</div>
              )}
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>{user.username}</div>
              <div className="text-[10px] font-mono uppercase tracking-[.14em]" style={{ color: 'var(--admin-text-muted)' }}>
                {rk.toLowerCase()}
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--admin-text-muted)' }}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden"
              style={{ ...dropdownStyle, backdropFilter: 'blur(12px)', zIndex: 50 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <div className="w-12 h-14 rounded-lg overflow-hidden flex-none" style={{ background: 'var(--admin-surface-soft)' }}>
                  {user.look ? (
                    <Avatar look={user.look} size="m" className="w-full h-full object-cover object-top" style={{ imageRendering: 'pixelated' }} />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}
                    >{ini}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{user.username}</p>
                  <p className="text-[11px] font-mono uppercase tracking-[.12em]" style={{ color: '#F59E0B' }}>{rk}</p>
                </div>
              </div>

              {/* Links */}
              <div className="p-1.5">
                {([
                  { href: '/me',                                    Icon: LayoutDashboard, label: 'Mi dashboard' },
                  { href: `/community/profiles/${user.username}`,   Icon: User,            label: 'Mi perfil'    },
                  { href: '/settings',                              Icon: Settings,        label: 'Configuración'},
                ] as const).map(({ href, Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: 'var(--admin-text-muted)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--admin-primary-bg)'; el.style.color = 'var(--admin-text)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--admin-text-muted)'; }}
                  >
                    <Icon size={14} />{label}
                  </Link>
                ))}
              </div>

              <div className="p-1.5" style={{ borderTop: '1px solid var(--admin-border)' }}>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: '#EF4444' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={14} />Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
