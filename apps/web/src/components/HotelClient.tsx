'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Zap, AlertCircle, WifiOff, Play, RefreshCw, Users, Home, Star, Cpu, Maximize2, LogOut, RotateCcw, Wifi, FlaskConical, Construction } from 'lucide-react';
import { getAvatarUrl } from '@kodexa/shared';

interface HotelUser {
  username: string;
  look: string;
  credits: number;
  pixels: number;
  rank: number;
}

interface Wallet {
  credits: number;
  pixels: number;
  diamonds: number;
}

type LaunchState = 'loading' | 'ready' | 'error' | 'disconnected' | 'playing';

const PHASES = [
  'Verificando sesión',
  'Cargando recursos del hotel',
  'Iniciando motor gráfico',
  'Conectando al servidor',
  'Listo',
];

const TIPS = [
  { icon: <Home className="w-4 h-4" />, title: 'Explora las salas', body: 'Hay cientos de salas públicas con diseños únicos. Usa el Navegador para descubrir nuevas.' },
  { icon: <Users className="w-4 h-4" />, title: 'Haz amigos', body: 'Añade a otros usuarios como amigos y chatéa con ellos desde cualquier sala del hotel.' },
  { icon: <Star className="w-4 h-4" />, title: 'Gana créditos', body: 'Completa misiones diarias y eventos para ganar créditos y muebles exclusivos.' },
  { icon: <Cpu className="w-4 h-4" />, title: 'Wired scripting', body: 'Usa el editor Wired visual para crear minijuegos y mecánicas únicas en tu sala.' },
];

export default function HotelClient({ user }: { user: HotelUser }) {
  const [state, setState]         = useState<LaunchState>('loading');
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState(0);
  const [tipIdx, setTipIdx]       = useState(0);
  const [errorMsg, setErrorMsg]   = useState('');
  const [ssoTicket, setSsoTicket] = useState<string | null>(null);
  const [wallet, setWallet]       = useState<Wallet>({ credits: user.credits, pixels: user.pixels, diamonds: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const iframeRef   = useRef<HTMLIFrameElement>(null);

  const clientUrl = process.env['NEXT_PUBLIC_NITRO_URL'] ?? 'http://localhost:8081';

  // Simulate boot sequence
  const runBoot = useCallback(() => {
    setState('loading');
    setProgress(0);
    setPhase(0);

    const steps = [
      { pct: 20,  ph: 0, delay: 400  },
      { pct: 42,  ph: 1, delay: 900  },
      { pct: 64,  ph: 2, delay: 700  },
      { pct: 82,  ph: 3, delay: 600  },
      { pct: 100, ph: 4, delay: 500  },
    ];

    let elapsed = 0;
    steps.forEach(({ pct, ph, delay }) => {
      elapsed += delay;
      setTimeout(() => {
        setProgress(pct);
        setPhase(ph);
        if (pct === 100) {
          setTimeout(() => setState('ready'), 450);
        }
      }, elapsed);
    });
  }, []);

  useEffect(() => { runBoot(); }, [runBoot]);

  // Rotate tips every 4s during loading
  useEffect(() => {
    if (state !== 'loading') return;
    const id = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 4000);
    return () => clearInterval(id);
  }, [state]);

  // Load wallet from arcturus_main when game is playing
  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/wallet');
      if (!res.ok) return;
      const data = await res.json() as { ok: boolean; wallet: Wallet };
      if (data.ok) setWallet(data.wallet);
    } catch {
      // silent — keep last known values
    }
  }, []);

  useEffect(() => {
    if (state !== 'playing') return;
    // Initial fetch after entering the hotel
    void fetchWallet();
    // Refresh every 60s to reflect in-game purchases
    const id = setInterval(() => void fetchWallet(), 60_000);
    return () => clearInterval(id);
  }, [state, fetchWallet]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [settingsOpen]);

  async function launchGame() {
    try {
      const res = await fetch('/api/sso', { method: 'POST' });
      if (!res.ok) throw new Error('SSO failed');
      const { ticket } = await res.json() as { ticket: string };
      setSsoTicket(ticket);
      setState('playing');
    } catch {
      setErrorMsg('No se pudo generar el ticket de autenticación. Recarga la página.');
      setState('error');
    }
  }

  async function reloadHotel() {
    setSettingsOpen(false);
    try {
      const res = await fetch('/api/sso', { method: 'POST' });
      if (!res.ok) throw new Error('SSO failed');
      const { ticket } = await res.json() as { ticket: string };
      setSsoTicket(ticket);
      // Force iframe reload by temporarily clearing src
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = `${clientUrl}?sso=${encodeURIComponent(ticket)}`;
          }
        }, 100);
      }
    } catch {
      // silent — hotel stays loaded
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  const menuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '7px 14px', background: 'transparent', border: 'none',
    color: '#94A3B8', fontSize: '.75rem', cursor: 'pointer', textAlign: 'left',
  };

  const tip = TIPS[tipIdx]!;
  const avatarUrl = getAvatarUrl(user.look || 'hd-180-1', { size: 'l', direction: 2, gesture: 'sml' });

  // ── PLAYING STATE ───────────────────────────────────────────────────────────
  if (state === 'playing') {
    const iframeSrc = ssoTicket
      ? `${clientUrl}?sso=${encodeURIComponent(ssoTicket)}`
      : `${clientUrl}`;
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0B1322' }}>
        {/* Game topbar — MP-012.2: real wallet assets + functional settings */}
        <div className="topbar-game">
          {/* Left: logo K only */}
          <div className="logo-k" style={{ width: 24, height: 24, fontSize: '.75rem', flexShrink: 0 }}><span>K</span></div>

          {/* Right: currencies + controls */}
          <div className="ml-auto flex items-center gap-2">
            {/* Credits (arcturus type -1) */}
            <span className="gpill" title="Créditos" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hotel/currency/credits.png" alt="" width={15} height={15} style={{ imageRendering: 'pixelated' }} />
              {wallet.credits.toLocaleString()}
            </span>
            {/* Duckets (arcturus type 0) */}
            <span className="gpill" style={{ background: 'rgba(124,58,237,.12)', color: '#c4b5fd', borderColor: 'rgba(124,58,237,.25)', display: 'flex', alignItems: 'center', gap: 5 }} title="Duckets">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hotel/currency/duckets.png" alt="" width={15} height={15} style={{ imageRendering: 'pixelated' }} />
              {wallet.pixels.toLocaleString()}
            </span>
            {/* Diamonds (arcturus type 5) */}
            <span className="gpill" style={{ background: 'rgba(59,130,246,.10)', color: '#93c5fd', borderColor: 'rgba(59,130,246,.25)', display: 'flex', alignItems: 'center', gap: 5 }} title="Diamantes">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hotel/currency/diamonds.png" alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
              {wallet.diamonds.toLocaleString()}
            </span>

            {/* Settings dropdown */}
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                title="Configuración"
                onClick={() => setSettingsOpen(o => !o)}
                style={settingsOpen ? { color: '#00D4AA', background: 'rgba(0,212,170,.1)' } : undefined}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              {settingsOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200,
                  background: 'rgba(15,23,42,.97)', border: '1px solid #1f2b41',
                  borderRadius: 10, padding: '6px 0', minWidth: 180,
                  boxShadow: '0 8px 32px rgba(0,0,0,.5)',
                }}>
                  {/* Status */}
                  <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #1f2b41' }}>
                    <div style={{ fontSize: '.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Estado</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', color: '#10B981' }}>
                      <Wifi className="w-3 h-3" /> Conectado
                    </div>
                  </div>
                  {/* Actions */}
                  <button
                    onClick={() => void reloadHotel()}
                    style={menuItemStyle}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Recargar hotel
                  </button>
                  <button
                    onClick={() => { setSettingsOpen(false); toggleFullscreen(); }}
                    style={menuItemStyle}
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Pantalla completa
                  </button>
                  <div style={{ borderTop: '1px solid #1f2b41', margin: '4px 0' }} />
                  <button
                    onClick={() => { setSettingsOpen(false); void signOut({ callbackUrl: '/login' }); }}
                    style={{ ...menuItemStyle, color: '#f87171' }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Salir del hotel
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="icon-btn"
              title="Pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="icon-btn"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game iframe */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="fullscreen"
          title="Kodexa Hotel"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1322' }}>
      {/* Top bar */}
      <div className="topbar-game">
        <div className="logo-k" style={{ width: 28, height: 28, fontSize: '.85rem' }}><span>K</span></div>
        <span className="font-bold text-sm" style={{ color: '#F8FAFC' }}>Kodexa<span style={{ color: '#00D4AA' }}>.</span>Hotel</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="gpill"><Zap className="w-3 h-3 inline mr-1" />{user.credits.toLocaleString()} créditos</span>
          <span className="gpill" style={{ background: 'rgba(124,58,237,.12)', color: '#c4b5fd', borderColor: 'rgba(124,58,237,.25)' }}>
            {user.pixels.toLocaleString()} píxeles
          </span>
          <div
            className="avt ml-2"
            style={{ background: 'linear-gradient(135deg,#5BFFD7,#7C3AED)', width: 28, height: 28, fontSize: '.72rem' }}
          >
            {user.username.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="aurora a" style={{ opacity: .25 }} />
        <div className="aurora b" style={{ opacity: .2 }} />
        <div className="stars" />

        {/* ── LOADING STATE ── */}
        <div className={`lstate${state === 'loading' ? ' active' : ''} gap-8 w-full max-w-md px-6 text-center`}>
          {/* Animated logo */}
          <div className="logo-pulse">
            <div
              className="float-y"
              style={{
                width: 90, height: 90, borderRadius: 22,
                background: 'linear-gradient(135deg,#00D4AA,#7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.6rem', fontWeight: 800, color: '#fff',
                boxShadow: '0 0 40px rgba(0,212,170,.4), 0 20px 60px rgba(124,58,237,.3)',
                animation: 'logoBreathe 2.5s ease-in-out infinite',
              }}
            >K</div>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#F8FAFC' }}>
              Bienvenido, <span style={{ color: '#00D4AA' }}>{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>Preparando tu experiencia en el hotel…</p>
          </div>

          {/* Progress */}
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-mono" style={{ color: '#475569' }}>{progress}%</span>
          </div>

          {/* Phase steps */}
          <div className="flex flex-col gap-2 w-full">
            {PHASES.map((p, i) => (
              <div
                key={p}
                className={`phase${i < phase ? ' done' : ''}${i === phase ? ' cur' : ''}`}
              >
                <span className="phase-dot" />
                {p}
                {i < phase && <span className="ml-auto text-[10px] font-mono" style={{ color: '#10B981' }}>✓</span>}
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="tip-card">
            <div className="tip-icon">{tip.icon}</div>
            <div className="text-left">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#00D4AA' }}>{tip.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{tip.body}</div>
            </div>
          </div>
        </div>

        {/* ── READY STATE ── */}
        <div className={`lstate${state === 'ready' ? ' active' : ''} gap-8 w-full max-w-lg px-6 text-center items-center`}>
          {/* Avatar preview */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0,212,170,.15), rgba(124,58,237,.15))',
              border: '2px solid rgba(0,212,170,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={user.username}
                style={{ imageRendering: 'pixelated', transform: 'scale(1.4)', marginTop: 12 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full"
              style={{ background: '#10B981', border: '2px solid #0B1322' }}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#F8FAFC' }}>
              Todo listo, <span className="text-gradient">{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>El hotel está esperándote. ¡Que lo disfrutes!</p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            {[
              { label: 'Créditos',  value: user.credits.toLocaleString(), color: '#F59E0B' },
              { label: 'Píxeles',   value: user.pixels.toLocaleString(),  color: '#7C3AED' },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: 'rgba(19,30,54,.8)', border: '1px solid #1f2b41',
                  borderRadius: 12, padding: '.75rem 1.25rem', textAlign: 'center', minWidth: 110,
                }}
              >
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#475569' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Launch buttons */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              onClick={launchGame}
              className="btn flex items-center gap-2.5 text-base px-8 py-3 w-full justify-center"
              style={{ fontSize: '1rem', borderRadius: 14, boxShadow: '0 0 40px rgba(0,212,170,.3)' }}
            >
              <Play className="w-5 h-5 fill-current" />
              Entrar al Hotel Principal
            </button>

            {/* DEVELOPER / FOUNDER — Desarrollo access (rank >= 9) */}
            {user.rank >= 9 && process.env['NEXT_PUBLIC_ENABLE_DEV_HOTEL'] !== 'false' && (
              <a
                href="/desarrollo"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium w-full justify-center"
                style={{
                  border: '1px solid rgba(245,158,11,.4)',
                  color: '#fbbf24',
                  background: 'rgba(245,158,11,.08)',
                  textDecoration: 'none',
                }}
              >
                <Construction className="w-4 h-4" />
                Desarrollo (DEVELOPER)
              </a>
            )}

            {/* FOUNDER only — Beta Hotel access (rank >= 10) */}
            {user.rank >= 10 && process.env['NEXT_PUBLIC_ENABLE_BETA_HOTEL'] !== 'false' && (
              <a
                href="/hotel-beta"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium w-full justify-center"
                style={{
                  border: '1px solid rgba(124,58,237,.4)',
                  color: '#a78bfa',
                  background: 'rgba(124,58,237,.08)',
                  textDecoration: 'none',
                }}
              >
                <FlaskConical className="w-4 h-4" />
                Hotel Beta (FOUNDER)
              </a>
            )}
          </div>
        </div>

        {/* ── ERROR STATE ── */}
        <div className={`lstate${state === 'error' ? ' active' : ''} gap-6 px-6`}>
          <div className="alert-card flex flex-col items-center gap-5 text-center" style={{ maxWidth: 400 }}>
            <div className="alert-icon"><AlertCircle className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Algo salió mal</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {errorMsg || 'No fue posible iniciar el cliente del juego. Inténtalo de nuevo.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={runBoot} className="btn flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />Reintentar
              </button>
              <a
                href="/support"
                className="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #2a3b5b', color: '#94A3B8' }}
              >
                Soporte
              </a>
            </div>
          </div>
        </div>

        {/* ── DISCONNECTED STATE ── */}
        <div className={`lstate${state === 'disconnected' ? ' active' : ''} gap-6 px-6`}>
          <div className="alert-card flex flex-col items-center gap-5 text-center" style={{ maxWidth: 400 }}>
            <div className="alert-icon" style={{ background: 'rgba(245,158,11,.1)', color: '#fbbf24' }}>
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Conexión perdida</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                Se perdió la conexión con el servidor del hotel. Comprueba tu conexión a internet e inténtalo de nuevo.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={runBoot} className="btn flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />Reconectar
              </button>
              <button
                onClick={() => setState('ready')}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #2a3b5b', color: '#94A3B8', background: 'transparent' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

        {/* Preview game window (shown behind ready state) */}
        {state === 'ready' && (
          <div style={{
            position: 'absolute', inset: 0, opacity: .06, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(0,212,170,.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        )}
      </div>

      {/* Footer */}
      <div
        className="px-6 py-3 flex items-center justify-between text-xs font-mono"
        style={{ borderTop: '1px solid #1f2b41', color: '#334155' }}
      >
        <span>© 2025 Kodexa Hotel · launcher v0.9.0-beta</span>
        <span className="flex items-center gap-1.5">
          <span className="pulse-dot" />
          <span style={{ color: '#10B981' }}>servidor estable</span>
        </span>
      </div>
    </div>
  );
}
