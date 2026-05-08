'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, UsersRound, Home, ShoppingBag, Newspaper,
  Settings, Terminal, LogOut, Crown, Bell,
  ChevronDown, Search, ChevronRight,
  Ban, Filter, Shield, Award, Megaphone,
  UserPlus, AlertTriangle, X, MessageSquare, User,
} from 'lucide-react';
import { RANK_LABELS, rankBadgeClass } from '@kodexa/shared';
import { Avatar, AvatarHead } from '@/components/Avatar';

interface AdminUser { username: string; rank: number; look?: string; }

interface Notif {
  id: string;
  type: 'register' | 'ban' | 'alert';
  text: string;
  href: string;
  time: string;
}

function rankInfo(rank: number) {
  return { label: RANK_LABELS[rank] ?? 'Normal', cls: rankBadgeClass(rank) };
}
function initials(s: string) {
  return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

const NOTIF_ICONS = {
  register: <UserPlus size={13} className="text-[#3B82F6]" />,
  ban:      <Ban size={13} className="text-[#EF4444]" />,
  alert:    <AlertTriangle size={13} className="text-[#F59E0B]" />,
};

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

const NAV_OP = [
  { label: 'Dashboard',   href: '/admin',       Icon: LayoutDashboard, exact: true  },
  { label: 'Usuarios',    href: '/admin/users',  Icon: UsersRound,      exact: false },
  { label: 'Salas',       href: '/admin/rooms',  Icon: Home,            exact: false },
  { label: 'Catálogo',    href: null,            Icon: ShoppingBag,     exact: false },
  { label: 'Noticias',    href: '/admin/news',   Icon: Newspaper,       exact: false },
];

const NAV_SYS = [
  { label: 'Configuración', href: '/admin/settings',    Icon: Settings      },
  { label: 'Logs',          href: '/admin/logs',        Icon: Terminal      },
  { label: 'Bans',          href: '/admin/bans',        Icon: Ban           },
  { label: 'Wordfilter',    href: '/admin/wordfilter',  Icon: Filter        },
  { label: 'Permisos',      href: '/admin/permissions', Icon: Shield        },
  { label: 'Badges',        href: '/admin/badges',      Icon: Award         },
  { label: 'Alertas',       href: '/admin/alerts',      Icon: Megaphone     },
  { label: 'Mensajes',      href: '/admin/messages',    Icon: MessageSquare },
];

const SB_WIDTH_OPEN      = 240;
const SB_WIDTH_COLLAPSED = 60;

export default function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();

  const [collapsed,    setCollapsed]    = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_sb_collapsed') === 'true';
  });
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifs,       setNotifs]       = useState<Notif[]>([]);
  const [unread,       setUnread]       = useState(0);

  const notifRef   = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const rk    = rankInfo(user.rank);
  const ini   = initials(user.username);
  const crumb = CRUMBS[pathname] ?? 'Panel';

  function active(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function toggleCollapse() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sb_collapsed', String(next));
      return next;
    });
  }

  // Load notifications
  useEffect(() => {
    fetch('/api/admin/notifications')
      .then(r => r.json())
      .then(d => {
        if (d.notifications) {
          setNotifs(d.notifications);
          setUnread(d.notifications.length);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const sbWidth = collapsed ? SB_WIDTH_COLLAPSED : SB_WIDTH_OPEN;

  return (
    <div className="flex min-h-screen" style={{ background: '#0B1322', color: '#F8FAFC' }}>
      {/* ── SIDEBAR ── */}
      <aside
        className="sb shrink-0 flex flex-col"
        style={{ zIndex: 60, width: sbWidth, minWidth: sbWidth, transition: 'width 300ms ease', overflowX: 'hidden' }}
      >
        {/* Brand — click toggles sidebar */}
        <button
          onClick={toggleCollapse}
          className="px-3 py-5 flex items-center gap-2.5 flex-none w-full text-left"
          style={{ borderBottom: '1px solid #1f2b41', cursor: 'pointer', transition: 'opacity 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <div className="logo-k flex-none"><span>K</span></div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-bold tracking-tight whitespace-nowrap">Kodexa<span style={{ color: '#00D4AA' }}>.</span></div>
              <div className="text-[10px] uppercase tracking-[.22em] font-mono" style={{ color: '#94A3B8' }}>Hotel</div>
            </div>
          )}
        </button>

        {/* Profile mini */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-2 flex-none">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: '#0a1224', border: '1px solid #1f2b41' }}>
              <div className="flex-none w-10 h-12 overflow-hidden rounded-lg" style={{ background: '#0F172A' }}>
                {user.look ? (
                  <Avatar look={user.look} size="m" className="w-full h-full object-cover object-top" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}>{ini}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{user.username}</div>
                <div className="text-[10px] font-mono uppercase tracking-[.14em] flex items-center gap-1" style={{ color: '#F59E0B' }}>
                  <Crown className="w-3 h-3 flex-none" />{rk.label.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="px-3 py-2 flex-none flex justify-center">
            <div className="w-9 h-9 rounded-full overflow-hidden" style={{ background: '#0F172A', outline: '2px solid #334155', outlineOffset: '1px' }}>
              {user.look ? (
                <AvatarHead look={user.look} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}>{ini}</div>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 overflow-y-auto overflow-x-hidden pb-4">
          {!collapsed && <div className="nav-section">Operación</div>}
          {collapsed && <div className="h-3" />}
          {NAV_OP.map(({ label, href, Icon, exact }) =>
            href ? (
              <Link
                key={label}
                href={href}
                className={`nav-item${active(href, exact) ? ' active' : ''}`}
                style={collapsed ? { justifyContent: 'center', padding: '0.5rem' } : undefined}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-none" />
                {!collapsed && label}
              </Link>
            ) : (
              <div
                key={label}
                className="nav-item"
                style={{ opacity: .4, cursor: 'default', ...(collapsed ? { justifyContent: 'center', padding: '0.5rem' } : {}) }}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-none" />
                {!collapsed && label}
              </div>
            )
          )}

          {!collapsed && <div className="nav-section">Sistema</div>}
          {collapsed && <div className="h-3" />}
          {NAV_SYS.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className={`nav-item${active(href, false) ? ' active' : ''}`}
              style={collapsed ? { justifyContent: 'center', padding: '0.5rem' } : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-none" />
              {!collapsed && label}
            </Link>
          ))}

          <div className="h-3" />
          <button
            className="nav-item w-full text-left"
            style={collapsed ? { justifyContent: 'center', padding: '0.5rem' } : undefined}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="w-4 h-4 flex-none" />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </nav>

        {/* Server status */}
        {!collapsed && (
          <div className="m-2 p-3 rounded-xl text-xs flex-none" style={{ background: '#0a1224', border: '1px solid #1f2b41' }}>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[.16em] font-mono text-[10px]" style={{ color: '#94A3B8' }}>Servidor</span>
              <span className="flex items-center gap-1.5">
                <span className="pulse-dot" />
                <span style={{ color: '#10B981' }} className="font-medium">Estable</span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 font-mono" style={{ color: '#94A3B8' }}>
              <span>CPU 24%</span><span>RAM 3.2G</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="m-2 flex justify-center flex-none">
            <span className="pulse-dot" />
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="topbar sticky top-0 z-30 px-5 lg:px-7 flex items-center gap-4">

          <div className="crumb hidden md:flex items-center gap-2">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" style={{ color: 'rgba(148,163,184,.6)' }} />
            <b>{crumb}</b>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex relative items-center" style={{ width: 260 }}>
              <Search className="w-4 h-4 pointer-events-none absolute" style={{ left: '.7rem', color: '#64748B', zIndex: 1 }} />
              <input
                className="inp"
                style={{ paddingLeft: '2.3rem', paddingRight: '4rem' }}
                placeholder="Buscar usuarios, salas…"
              />
              <span className="absolute right-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ color: 'rgba(148,163,184,.7)', border: '1px solid rgba(51,65,85,.5)' }}>⌘K</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className="icon-btn relative"
                onClick={() => { setNotifOpen(v => !v); setUnread(0); }}
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                        style={{ background: '#EF4444', outline: '2px solid #0e1627' }} />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl overflow-hidden"
                     style={{ background: '#0e1627', border: '1px solid #1f2b41', zIndex: 100 }}>
                  <div className="flex items-center justify-between px-4 py-3"
                       style={{ borderBottom: '1px solid #1f2b41' }}>
                    <span className="text-sm font-semibold">Notificaciones</span>
                    <button onClick={() => setNotifOpen(false)} className="text-[#475569] hover:text-[#94A3B8]">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-[#475569]">Sin notificaciones</p>
                    ) : notifs.map(n => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-surface transition-colors"
                        style={{ borderBottom: '1px solid #1f2b41' }}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none mt-0.5"
                             style={{ background: '#0F172A', border: '1px solid #334155' }}>
                          {NOTIF_ICONS[n.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#F8FAFC] leading-snug">{n.text}</p>
                          <p className="text-[11px] text-[#475569] mt-0.5">{timeAgo(n.time)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-2.5" style={{ borderTop: '1px solid #1f2b41' }}>
                    <Link href="/admin/logs" onClick={() => setNotifOpen(false)}
                          className="text-xs text-primary hover:underline">
                      Ver todos los logs →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2.5 pl-3 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-colors cursor-pointer"
                style={{ borderLeft: '1px solid #1f2b41' }}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-none" style={{ background: '#0F172A', outline: '2px solid #334155', outlineOffset: '1px' }}>
                  {user.look ? (
                    <AvatarHead look={user.look} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}>{ini}</div>
                  )}
                </div>
                <div className="hidden md:block leading-tight">
                  <div className="text-sm font-medium">{user.username}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[.14em]" style={{ color: '#94A3B8' }}>
                    {rk.label.toLowerCase()}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  style={{ color: '#94A3B8' }}
                />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    background:   '#0e1627',
                    border:       '1px solid #1f2b41',
                    backdropFilter: 'blur(12px)',
                    zIndex:       50,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1f2b41' }}>
                    <div className="w-12 h-14 rounded-lg overflow-hidden flex-none" style={{ background: '#0F172A' }}>
                      {user.look ? (
                        <Avatar look={user.look} size="m" className="w-full h-full object-cover object-top" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}>{ini}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F8FAFC] truncate">{user.username}</p>
                      <p className="text-[11px] font-mono uppercase tracking-[.12em]" style={{ color: '#F59E0B' }}>
                        {rk.label}
                      </p>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="p-1.5">
                    <Link
                      href="/me"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-primary/10 transition-colors"
                    >
                      <LayoutDashboard size={14} />Mi dashboard
                    </Link>
                    <Link
                      href={`/community/profiles/${user.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-primary/10 transition-colors"
                    >
                      <User size={14} />Mi perfil
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-primary/10 transition-colors"
                    >
                      <Settings size={14} />Configuración
                    </Link>
                  </div>

                  <div className="p-1.5" style={{ borderTop: '1px solid #1f2b41' }}>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-[#EF4444] hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={14} />Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 lg:px-7 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>

        <footer className="px-7 py-4 text-xs flex items-center justify-between font-mono"
                style={{ color: 'rgba(148,163,184,.6)', borderTop: '1px solid #1f2b41' }}>
          <span>© 2025 Kodexa Hotel · admin v0.9.0-beta</span>
          <span className="flex items-center gap-1.5"><span className="pulse-dot" /> servers operational</span>
        </footer>
      </div>
    </div>
  );
}
