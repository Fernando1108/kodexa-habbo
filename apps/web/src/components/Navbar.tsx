'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown, Settings, LogOut, User, Users, Newspaper, Trophy,
  Home, ShoppingBag, LayoutDashboard, Shield, Menu, X, Camera, Gamepad2,
  MessageSquare, Construction,
} from 'lucide-react';
import { RANK_LABELS, RANK_COLORS } from '@kodexa/shared';
import { Avatar, AvatarHead } from '@/components/Avatar';

interface SessionUser {
  username?: string | null;
  rank?:     number | null;
  look?:     string | null;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

const communityLinks = [
  { href: '/community/news',     icon: <Newspaper size={14} />, label: 'Noticias' },
  { href: '/community/rankings', icon: <Trophy    size={14} />, label: 'Rankings' },
  { href: '/community/rooms',    icon: <Home      size={14} />, label: 'Salas populares' },
  { href: '/community/staff',    icon: <Users     size={14} />, label: 'Equipo' },
  { href: '/community/photos',   icon: <Camera    size={14} />, label: 'Fotos' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user as SessionUser | undefined;
  const rank = user?.rank ?? 1;

  const [commOpen,    setCommOpen]    = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [rewardPending, setRewardPending] = useState(false);
  const [unreadMsgs, setUnreadMsgs]   = useState(0);

  const commRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useClickOutside(commRef, () => setCommOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));

  useEffect(() => {
    fetch('/api/users/online-count')
      .then(r => r.json())
      .then((d: { count: number }) => setOnlineCount(d.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/me/reward-status')
      .then(r => r.json())
      .then((d: { claimed: boolean }) => setRewardPending(!d.claimed))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/messages/unread')
      .then(r => r.json())
      .then((d: { unread: number }) => setUnreadMsgs(d.unread ?? 0))
      .catch(() => {});
  }, [status]);

  /* Close mobile drawer on navigation */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  const rankColor = (RANK_COLORS as Record<number, string>)[rank] ?? '#94A3B8';

  return (
    <>
      <nav className="kx-navbar sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-[60px] flex items-center gap-4">

          {/* ── Logo ── */}
          <Link href={session ? '/me' : '/'} className="flex items-center gap-2.5 flex-none">
            <div className="logo-k" style={{ width: 34, height: 34, fontSize: '.88rem' }}>
              <span>K</span>
            </div>
            <span className="font-bold text-sm text-[#F8FAFC] tracking-tight hidden sm:block">
              Kodexa<span style={{ color: '#00D4AA' }}>.</span>Hotel
            </span>
          </Link>

          {/* ── Nav links (desktop) ── */}
          {session && (
            <div className="hidden md:flex items-center gap-0.5 ml-2 flex-1 min-w-0">
              <Link href="/me" className={`kx-nav-link ${isActive('/me') ? 'active' : ''}`}>
                Inicio
              </Link>

              {/* Comunidad dropdown */}
              <div ref={commRef} className="relative">
                <button
                  onClick={() => setCommOpen(v => !v)}
                  className={`kx-nav-link flex items-center gap-1 ${pathname.startsWith('/community') ? 'active' : ''}`}
                >
                  Comunidad
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${commOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {commOpen && (
                  <div className="kx-dropdown w-52" onClick={() => setCommOpen(false)}>
                    {communityLinks.map(l => (
                      <Link key={l.href} href={l.href} className="kx-dropdown-item">
                        {l.icon}{l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/marketplace" className={`kx-nav-link ${isActive('/marketplace') ? 'active' : ''}`}>
                <ShoppingBag size={13} className="inline mr-1.5 opacity-70" />
                <span>Marketplace</span>
              </Link>

              <Link href="/hotel" className={`kx-nav-link flex items-center gap-1.5 ${isActive('/hotel') ? 'active' : ''}`}>
                <Gamepad2 size={13} style={{ color: '#00D4AA' }} />
                Hotel
              </Link>

              {rank >= 7 && (
                <Link href="/admin" className={`kx-nav-link flex items-center gap-1.5 ${isActive('/admin') ? 'active' : ''}`}>
                  <Shield size={13} style={{ color: '#EF4444' }} />
                  Admin
                </Link>
              )}

              {rank >= 9 && (
                <Link href="/desarrollo" className={`kx-nav-link flex items-center gap-1.5 ${isActive('/desarrollo') ? 'active' : ''}`}>
                  <Construction size={13} style={{ color: '#F59E0B' }} />
                  Dev
                </Link>
              )}

              {/* Online pill */}
              {onlineCount !== null && (
                <span className="navbar-online-pill ml-3">
                  <span className="kx-online-dot" />
                  {onlineCount} online
                </span>
              )}
            </div>
          )}

          {!session && <div className="flex-1" />}

          {/* ── Right side ── */}
          <div className="ml-auto flex items-center gap-2">
            {session ? (
              <>
                {/* Online pill — mobile only */}
                {onlineCount !== null && (
                  <span className="navbar-online-pill md:hidden text-[10px] px-2 py-1">
                    <span className="kx-online-dot" />
                    {onlineCount}
                  </span>
                )}

                {/* Messages icon */}
                <Link
                  href="/messages"
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-colors text-[#94A3B8] hover:text-[#F8FAFC]"
                  title="Mensajes"
                >
                  <MessageSquare size={18} />
                  {unreadMsgs > 0 && (
                    <span
                      className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
                      style={{ background: '#EF4444', outline: '2px solid #0F172A' }}
                    >
                      {unreadMsgs > 9 ? '9+' : unreadMsgs}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div ref={userRef} className="relative">
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex-none relative"
                      style={{ outline: `2px solid ${rankColor}`, outlineOffset: '1px' }}
                    >
                      {user?.look ? (
                        <AvatarHead look={user.look} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#00D4AA] to-[#7C3AED]" />
                      )}
                      {rewardPending && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#0F172A]" />
                      )}
                    </div>
                    <span className="text-sm text-[#F8FAFC] hidden sm:block max-w-[90px] truncate font-medium">
                      {user?.username}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-[#94A3B8] transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {userOpen && (
                    <div className="kx-dropdown w-56" onClick={() => setUserOpen(false)}>
                      {/* Header */}
                      <div className="px-3 py-3 flex items-center gap-3 border-b border-[#1f2b41] mb-1">
                        <div
                          className="w-12 h-14 rounded-lg overflow-hidden flex-none"
                          style={{ background: '#0F172A', outline: `2px solid ${rankColor}`, outlineOffset: '1px' }}
                        >
                          {user?.look ? (
                            <Avatar look={user.look} size="m" className="w-full h-full object-cover object-top" style={{ imageRendering: 'pixelated' }} />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#00D4AA] to-[#7C3AED]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F8FAFC] truncate">{user?.username}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: rankColor }}>
                            {(RANK_LABELS as Record<number, string>)[rank] ?? 'Normal'}
                          </p>
                        </div>
                      </div>

                      <Link href="/me"       className="kx-dropdown-item"><LayoutDashboard size={14}/>Mi dashboard</Link>
                      <Link href={`/community/profiles/${user?.username}`} className="kx-dropdown-item">
                        <User size={14}/>Mi perfil público
                      </Link>
                      <Link href="/settings" className="kx-dropdown-item"><Settings size={14}/>Configuración</Link>

                      <div className="border-t border-[#1f2b41] mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="kx-dropdown-item danger w-full"
                        >
                          <LogOut size={14}/>Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(v => !v)}
                  className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-[#94A3B8]"
                  aria-label="Menú"
                >
                  <Menu size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"    className="btn btn-outline py-2 px-4 text-sm">Entrar</Link>
                <Link href="/register" className="btn btn-primary py-2 px-4 text-sm">Registrarse</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {session && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="kx-mobile-drawer fixed right-0 top-0 bottom-0 z-50 w-[280px] md:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 h-[60px] border-b border-[#1f2b41] flex-none">
              <span className="text-sm font-semibold text-[#F8FAFC]">Menú</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#94A3B8]"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="px-3 py-4 flex flex-col gap-1 overflow-y-auto flex-1">
              <Link href="/me"                  className={`kx-mobile-link ${isActive('/me') ? 'active' : ''}`}><Home size={16}/>Inicio</Link>
              <Link href="/messages"            className={`kx-mobile-link ${isActive('/messages') ? 'active' : ''}`}>
                <MessageSquare size={16}/>Mensajes{unreadMsgs > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#EF4444' }}>{unreadMsgs}</span>}
              </Link>
              <Link href="/community/news"      className={`kx-mobile-link ${isActive('/community/news') ? 'active' : ''}`}><Newspaper size={16}/>Noticias</Link>
              <Link href="/community/rankings"  className={`kx-mobile-link ${isActive('/community/rankings') ? 'active' : ''}`}><Trophy size={16}/>Rankings</Link>
              <Link href="/community/rooms"     className={`kx-mobile-link ${isActive('/community/rooms') ? 'active' : ''}`}><Home size={16}/>Salas populares</Link>
              <Link href="/community/staff"     className={`kx-mobile-link ${isActive('/community/staff') ? 'active' : ''}`}><Users size={16}/>Equipo</Link>
              <Link href="/community/photos"    className={`kx-mobile-link ${isActive('/community/photos') ? 'active' : ''}`}><Camera size={16}/>Fotos</Link>
              <Link href="/marketplace"         className={`kx-mobile-link ${isActive('/marketplace') ? 'active' : ''}`}><ShoppingBag size={16}/>Marketplace</Link>
              <Link href="/hotel"               className={`kx-mobile-link ${isActive('/hotel') ? 'active' : ''}`}><Gamepad2 size={16}/>Hotel</Link>
              {rank >= 7 && (
                <Link href="/admin" className={`kx-mobile-link ${isActive('/admin') ? 'active' : ''}`}><Shield size={16}/>Admin</Link>
              )}
              {rank >= 9 && (
                <Link href="/desarrollo" className={`kx-mobile-link ${isActive('/desarrollo') ? 'active' : ''}`}><Construction size={16}/>Desarrollo</Link>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
