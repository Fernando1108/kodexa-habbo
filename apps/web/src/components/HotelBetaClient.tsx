'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { AlertCircle, WifiOff, Play, RefreshCw, LogOut, Coins, Diamond, FlaskConical, Maximize2 } from 'lucide-react';
import { getAvatarUrl } from '@kodexa/shared';

interface HotelUser {
  username: string;
  look:     string;
  credits:  number;
  pixels:   number;
  rank:     number;
}

type LaunchState = 'loading' | 'ready' | 'error' | 'disconnected' | 'playing';

const PHASES = [
  'Verificando acceso FOUNDER',
  'Cargando emulador custom',
  'Iniciando motor beta',
  'Conectando al servidor beta',
  'Listo',
];

export default function HotelBetaClient({ user }: { user: HotelUser }) {
  const [state, setState]         = useState<LaunchState>('loading');
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState(0);
  const [errorMsg, setErrorMsg]   = useState('');
  const [ssoTicket, setSsoTicket] = useState<string | null>(null);

  const clientUrl = process.env['NEXT_PUBLIC_CLIENT_URL'] ?? 'http://localhost:3001';
  // Beta uses the custom emulator WebSocket URL via query param
  const betaWsUrl = process.env['NEXT_PUBLIC_BETA_HOTEL_WS_URL'] ?? 'ws://localhost:2097';

  const runBoot = useCallback(() => {
    setState('loading');
    setProgress(0);
    setPhase(0);

    const steps = [
      { pct: 20,  ph: 0, delay: 300 },
      { pct: 45,  ph: 1, delay: 600 },
      { pct: 68,  ph: 2, delay: 500 },
      { pct: 88,  ph: 3, delay: 400 },
      { pct: 100, ph: 4, delay: 300 },
    ];

    let elapsed = 0;
    steps.forEach(({ pct, ph, delay }) => {
      elapsed += delay;
      setTimeout(() => {
        setProgress(pct);
        setPhase(ph);
        if (pct === 100) setTimeout(() => setState('ready'), 350);
      }, elapsed);
    });
  }, []);

  useEffect(() => { runBoot(); }, [runBoot]);

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

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  const avatarUrl = getAvatarUrl(user.look || 'hd-180-1', { size: 'l', direction: 2, gesture: 'sml' });

  // ── PLAYING ──────────────────────────────────────────────────────────────────
  if (state === 'playing') {
    const iframeSrc = ssoTicket
      ? `${clientUrl}?sso=${encodeURIComponent(ssoTicket)}&ws=${encodeURIComponent(betaWsUrl)}`
      : `${clientUrl}?ws=${encodeURIComponent(betaWsUrl)}`;

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0B1322' }}>
        <div className="topbar-game">
          <div
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg,#7C3AED,#00D4AA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 800, color: '#fff',
            }}
          >
            β
          </div>
          <span className="font-bold text-xs" style={{ color: '#F8FAFC', flexShrink: 0 }}>
            Kodexa<span style={{ color: '#7C3AED' }}>.</span>Beta
          </span>
          <span
            className="text-xs font-mono ml-2 px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(124,58,237,.12)', color: '#a78bfa', fontSize: '0.65rem' }}
          >
            FOUNDER ONLY
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="gpill"><Coins className="w-3 h-3 inline mr-1" />{user.credits.toLocaleString()}</span>
            <span className="gpill" style={{ background: 'rgba(124,58,237,.12)', color: '#c4b5fd', borderColor: 'rgba(124,58,237,.25)' }}>
              <Diamond className="w-3 h-3 inline mr-1" />{user.pixels.toLocaleString()}
            </span>
            <button onClick={toggleFullscreen} className="icon-btn" title="Pantalla completa">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="icon-btn" title="Salir">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <iframe
          src={iframeSrc}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="fullscreen"
          title="Kodexa Hotel Beta"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1322' }}>
      {/* Top bar */}
      <div className="topbar-game">
        <FlaskConical className="w-5 h-5" style={{ color: '#7C3AED', flexShrink: 0 }} />
        <span className="font-bold text-sm" style={{ color: '#F8FAFC' }}>
          Kodexa<span style={{ color: '#7C3AED' }}>.</span>Hotel Beta
        </span>
        <span
          className="text-xs font-mono ml-2 px-2 py-0.5 rounded"
          style={{ background: 'rgba(124,58,237,.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,.3)' }}
        >
          FOUNDER ONLY
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="gpill"><Coins className="w-3 h-3 inline mr-1" />{user.credits.toLocaleString()} créditos</span>
          <div
            className="avt ml-2"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#00D4AA)', width: 28, height: 28, fontSize: '.72rem' }}
          >
            {user.username.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="aurora a" style={{ opacity: .15, filter: 'hue-rotate(120deg)' }} />
        <div className="aurora b" style={{ opacity: .1,  filter: 'hue-rotate(180deg)' }} />

        {/* ── LOADING ── */}
        <div className={`lstate${state === 'loading' ? ' active' : ''} gap-8 w-full max-w-md px-6 text-center`}>
          <div className="logo-pulse">
            <div
              className="float-y"
              style={{
                width: 90, height: 90, borderRadius: 22,
                background: 'linear-gradient(135deg,#7C3AED,#00D4AA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.6rem', fontWeight: 800, color: '#fff',
                boxShadow: '0 0 40px rgba(124,58,237,.4), 0 20px 60px rgba(0,212,170,.3)',
                animation: 'logoBreathe 2.5s ease-in-out infinite',
              }}
            >β</div>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#F8FAFC' }}>
              Hotel Beta, <span style={{ color: '#a78bfa' }}>{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>Iniciando el emulador Kodexa custom…</p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7C3AED,#00D4AA)' }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: '#475569' }}>{progress}%</span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {PHASES.map((p, i) => (
              <div key={p} className={`phase${i < phase ? ' done' : ''}${i === phase ? ' cur' : ''}`}>
                <span className="phase-dot" />
                {p}
                {i < phase && <span className="ml-auto text-[10px] font-mono" style={{ color: '#10B981' }}>✓</span>}
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(124,58,237,.08)',
              border: '1px solid rgba(124,58,237,.2)',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#94A3B8',
              textAlign: 'left',
            }}
          >
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>⚗ Entorno beta</span> — Este hotel usa el motor propio de Kodexa.
            Puede tener bugs o features incompletas. Tu feedback como FOUNDER es valioso.
          </div>
        </div>

        {/* ── READY ── */}
        <div className={`lstate${state === 'ready' ? ' active' : ''} gap-8 w-full max-w-lg px-6 text-center items-center`}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124,58,237,.15), rgba(0,212,170,.15))',
              border: '2px solid rgba(124,58,237,.3)',
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
              style={{ background: '#7C3AED', border: '2px solid #0B1322' }}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#F8FAFC' }}>
              Beta lista, <span style={{ background: 'linear-gradient(90deg,#7C3AED,#00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Conectando al emulador Kodexa Custom · Puerto 2097
            </p>
          </div>

          <button
            onClick={launchGame}
            className="btn flex items-center gap-2.5 text-base px-8 py-3"
            style={{
              fontSize: '1rem', borderRadius: 14,
              background: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
              boxShadow: '0 0 40px rgba(124,58,237,.4)',
            }}
          >
            <Play className="w-5 h-5 fill-current" />
            Entrar al Hotel Beta
          </button>

          <a href="/hotel" style={{ color: '#475569', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Volver al Hotel Principal
          </a>
        </div>

        {/* ── ERROR ── */}
        <div className={`lstate${state === 'error' ? ' active' : ''} gap-6 px-6`}>
          <div className="alert-card flex flex-col items-center gap-5 text-center" style={{ maxWidth: 400 }}>
            <div className="alert-icon"><AlertCircle className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Error al iniciar Beta</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {errorMsg || 'No fue posible iniciar el cliente beta. Asegúrate de que el emulador custom esté corriendo en el puerto 2097.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={runBoot} className="btn flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />Reintentar
              </button>
              <a href="/hotel" className="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #2a3b5b', color: '#94A3B8' }}>
                Hotel Principal
              </a>
            </div>
          </div>
        </div>

        {/* ── DISCONNECTED ── */}
        <div className={`lstate${state === 'disconnected' ? ' active' : ''} gap-6 px-6`}>
          <div className="alert-card flex flex-col items-center gap-5 text-center" style={{ maxWidth: 400 }}>
            <div className="alert-icon" style={{ background: 'rgba(245,158,11,.1)', color: '#fbbf24' }}>
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Conexión beta perdida</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                Se perdió la conexión con el servidor beta. Verifica que el emulador custom esté activo.
              </p>
            </div>
            <button onClick={runBoot} className="btn flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Reconectar
            </button>
          </div>
        </div>
      </div>

      <div
        className="px-6 py-3 flex items-center justify-between text-xs font-mono"
        style={{ borderTop: '1px solid #1f2b41', color: '#334155' }}
      >
        <span>© 2025 Kodexa Hotel · beta emulator v0.1.0-dev</span>
        <span className="flex items-center gap-1.5">
          <span className="pulse-dot" style={{ background: '#7C3AED' }} />
          <span style={{ color: '#a78bfa' }}>kodexa-custom engine</span>
        </span>
      </div>
    </div>
  );
}
