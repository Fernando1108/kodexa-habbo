'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, UsersRound, Home, ShoppingBag, Newspaper,
  Settings, Terminal, LogOut, Crown,
  Ban, Filter, Shield, Award, Megaphone, MessageSquare,
} from 'lucide-react';
import { RANK_LABELS, rankBadgeClass } from '@kodexa/shared';
import { Avatar, AvatarHead } from '@/components/Avatar';

interface SidebarUser {
  username: string;
  rank:     number;
  look?:    string;
}

interface Props {
  user:             SidebarUser;
  collapsed:        boolean;
  onToggleCollapse: () => void;
}

const WIDTH_OPEN      = 240;
const WIDTH_COLLAPSED = 60;

const NAV_OP = [
  { label: 'Dashboard', href: '/admin',       Icon: LayoutDashboard, exact: true  },
  { label: 'Usuarios',  href: '/admin/users',  Icon: UsersRound,      exact: false },
  { label: 'Salas',     href: '/admin/rooms',  Icon: Home,            exact: false },
  { label: 'Catálogo',  href: null,            Icon: ShoppingBag,     exact: false },
  { label: 'Noticias',  href: '/admin/news',   Icon: Newspaper,       exact: false },
] as const;

const NAV_SYS = [
  { label: 'Configuración', href: '/admin/settings',    Icon: Settings      },
  { label: 'Logs',          href: '/admin/logs',        Icon: Terminal      },
  { label: 'Bans',          href: '/admin/bans',        Icon: Ban           },
  { label: 'Wordfilter',    href: '/admin/wordfilter',  Icon: Filter        },
  { label: 'Permisos',      href: '/admin/permissions', Icon: Shield        },
  { label: 'Badges',        href: '/admin/badges',      Icon: Award         },
  { label: 'Alertas',       href: '/admin/alerts',      Icon: Megaphone     },
  { label: 'Mensajes',      href: '/admin/messages',    Icon: MessageSquare },
] as const;

function initials(s: string) {
  return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
}

export default function AdminSidebar({ user, collapsed, onToggleCollapse }: Props) {
  const pathname = usePathname();
  const width    = collapsed ? WIDTH_COLLAPSED : WIDTH_OPEN;
  const rk       = RANK_LABELS[user.rank] ?? 'Normal';
  const ini      = initials(user.username);

  function active(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const collapsedStyle = collapsed
    ? { justifyContent: 'center' as const, padding: '0.5rem' }
    : undefined;

  return (
    <aside
      className="sb shrink-0 flex flex-col"
      style={{ zIndex: 60, width, minWidth: width, transition: 'width 300ms ease', overflowX: 'hidden' }}
    >
      {/* Brand — click toggles */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="px-3 py-5 flex items-center gap-2.5 flex-none w-full text-left cursor-pointer"
        style={{ borderBottom: '1px solid var(--admin-border)', transition: 'opacity 150ms' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '.8'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <div className="logo-k flex-none"><span>K</span></div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
              Kodexa<span style={{ color: '#00D4AA' }}>.</span>
            </div>
            <div className="text-[10px] uppercase tracking-[.22em] font-mono" style={{ color: 'var(--admin-text-muted)' }}>
              Hotel
            </div>
          </div>
        )}
      </button>

      {/* Profile mini */}
      {!collapsed ? (
        <div className="px-3 pt-3 pb-2 flex-none">
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl"
            style={{ background: 'var(--admin-surface-soft)', border: '1px solid var(--admin-border)' }}
          >
            <div className="flex-none w-10 h-12 overflow-hidden rounded-lg" style={{ background: 'var(--admin-surface-soft)' }}>
              {user.look ? (
                <Avatar
                  look={user.look}
                  size="m"
                  className="w-full h-full object-cover object-top"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)' }}
                >{ini}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--admin-text)' }}>
                {user.username}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[.14em] flex items-center gap-1" style={{ color: '#F59E0B' }}>
                <Crown className="w-3 h-3 flex-none" />{rk.toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 flex-none flex justify-center">
          <div
            className="w-9 h-9 rounded-full overflow-hidden"
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
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto overflow-x-hidden pb-4">
        {!collapsed ? <div className="nav-section">Operación</div> : <div className="h-3" />}

        {NAV_OP.map(({ label, href, Icon, exact }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className={`nav-item${active(href, exact) ? ' active' : ''}`}
              style={collapsedStyle}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-none" />
              {!collapsed && label}
            </Link>
          ) : (
            <div
              key={label}
              className="nav-item"
              style={{ opacity: .4, cursor: 'default', ...collapsedStyle }}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-none" />
              {!collapsed && label}
            </div>
          )
        )}

        {!collapsed ? <div className="nav-section">Sistema</div> : <div className="h-3" />}

        {NAV_SYS.map(({ label, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className={`nav-item${active(href) ? ' active' : ''}`}
            style={collapsedStyle}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-none" />
            {!collapsed && label}
          </Link>
        ))}

        <div className="h-3" />
        <button
          type="button"
          className="nav-item w-full text-left"
          style={collapsedStyle}
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-4 h-4 flex-none" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </nav>

      {/* Server status */}
      {!collapsed ? (
        <div
          className="m-2 p-3 rounded-xl text-xs flex-none"
          style={{ background: 'var(--admin-surface-soft)', border: '1px solid var(--admin-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[.16em] font-mono text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>
              Servidor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span style={{ color: '#10B981' }} className="font-medium">Estable</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 font-mono" style={{ color: 'var(--admin-text-muted)' }}>
            <span>CPU 24%</span><span>RAM 3.2G</span>
          </div>
        </div>
      ) : (
        <div className="m-2 flex justify-center flex-none">
          <span className="pulse-dot" />
        </div>
      )}
    </aside>
  );
}
