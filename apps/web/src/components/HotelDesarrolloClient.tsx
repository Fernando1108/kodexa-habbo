'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { AlertCircle, WifiOff, Play, RefreshCw, LogOut, Coins, Diamond, Maximize2, FlaskConical, Construction } from 'lucide-react';
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
  'Verificando acceso DEVELOPER / FOUNDER',
  'Cargando entorno de desarrollo',
  'Iniciando Arcturus Dev',
  'Conectando al servidor dev',
  'Listo',
];

// Amber/orange palette — distinct from main (teal) and beta (purple)
const AMBER = '#F59E0B';
const AMBER_DIM = 'rgba(245,158,11,.12)';
const AMBER_BORDER = 'rgba(245,158,11,.25)';

export default function HotelDesarrolloClient({ user }: { user: HotelUser }) {
  const [state, setState]         = useState<LaunchState>('loading');
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState(0);
  const [errorMsg, setErrorMsg]   = useState('');
  const [ssoTicket, setSsoTicket] = useState<string | null>(null);

  const clientUrl = process.env['NEXT_PUBLIC_CLIENT_URL']      ?? 'http://localhost:3001';
  const devWsUrl  = process.env['NEXT_PUBLIC_DEV_HOTEL_WS_URL'] ?? 'ws://localhost:2098';

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
      setErrorMsg(
        'No se pudo generar el ticket de autenticación. ' +
        'Asegúrate de que Arcturus Dev esté corriendo en el puerto 2098.'
      );
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
      ? `${clientUrl}?sso=${encodeURIComponent(ssoTicket)}&ws=${encodeURIComponent(devWsUrl)}`
      : `${clientUrl}?ws=${encodeURIComponent(devWsUrl)}`;

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0B1322' }}>
        <div className="topbar-game">
          <div
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg,${AMBER},#D97706)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 800, color: '#0B1322',
            }}
          >
            D
          </div>
          <span className="font-bold text-xs" style={{ color: '#F8FAFC', flexShrink: 0 }}>
            Kodexa<span style={{ color: AMBER }}>.</span>Desarrollo
          </span>
          <span
            className="text-xs font-mono ml-2 px-1.5 py-0.5 rounded"
            style={{ background: AMBER_DIM, color: AMBER, fontSize: '0.65rem' }}
          >
            DEV ONLY
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
          title="Kodexa Desarrollo"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1322' }}>
      {/* Top bar */}
      <div className="topbar-game">
        <Construction className="w-5 h-5" style={{ color: AMBER, flexShrink: 0 }} />
        <span className="font-bold text-sm" style={{ color: '#F8FAFC' }}>
          Kodexa<span style={{ color: AMBER }}>.</span>Desarrollo
        </span>
        <span
          className="text-xs font-mono ml-2 px-2 py-0.5 rounded"
          style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}
        >
          DEVELOPER / FOUNDER
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="gpill"><Coins className="w-3 h-3 inline mr-1" />{user.credits.toLocaleString()} créditos</span>
          <div
            className="avt ml-2"
            style={{ background: `linear-gradient(135deg,${AMBER},#D97706)`, width: 28, height: 28, fontSize: '.72rem', color: '#0B1322' }}
          >
            {user.username.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="aurora a" style={{ opacity: .1, filter: 'hue-rotate(40deg) saturate(1.5)' }} />
        <div className="aurora b" style={{ opacity: .08, filter: 'hue-rotate(20deg)' }} />

        {/* ── LOADING ── */}
        <div className={`lstate${state === 'loading' ? ' active' : ''} gap-8 w-full max-w-md px-6 text-center`}>
          <div className="logo-pulse">
            <div
              className="float-y"
              style={{
                width: 90, height: 90, borderRadius: 22,
                background: `linear-gradient(135deg,${AMBER},#D97706)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.6rem', fontWeight: 800, color: '#0B1322',
                boxShadow: `0 0 40px rgba(245,158,11,.4), 0 20px 60px rgba(217,119,6,.3)`,
                animation: 'logoBreathe 2.5s ease-in-out infinite',
              }}
            >D</div>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#F8FAFC' }}>
              Desarrollo, <span style={{ color: AMBER }}>{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>Iniciando entorno Arcturus Dev…</p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg,${AMBER},#D97706)` }}
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
              background: AMBER_DIM,
              border: `1px solid ${AMBER_BORDER}`,
              borderRadius: 12,
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: '#94A3B8',
              textAlign: 'left',
            }}
          >
            <span style={{ color: AMBER, fontWeight: 600 }}>⚙ Entorno de desarrollo</span> — Acceso exclusivo para DEVELOPER / FOUNDER.
            Aquí se prueban catálogos, tiendas, furnis y actualizaciones antes de pasar a producción.
          </div>
        </div>

        {/* ── READY ── */}
        <div className={`lstate${state === 'ready' ? ' active' : ''} gap-8 w-full max-w-lg px-6 text-center items-center`}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: `linear-gradient(135deg, ${AMBER_DIM}, rgba(217,119,6,.15))`,
              border: `2px solid ${AMBER_BORDER}`,
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
              style={{ background: AMBER, border: '2px solid #0B1322' }}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#F8FAFC' }}>
              Dev listo, <span style={{ color: AMBER }}>{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Conectando a Arcturus Dev · Puerto 2098
            </p>
          </div>

          <div
            style={{
              background: AMBER_DIM,
              border: `1px solid ${AMBER_BORDER}`,
              borderRadius: 12,
              padding: '0.75rem 1.25rem',
              fontSize: '0.8rem',
              color: '#94A3B8',
              maxWidth: 420,
              textAlign: 'left',
            }}
          >
            <FlaskConical className="w-4 h-4 inline mr-1.5" style={{ color: AMBER }} />
            <strong style={{ color: AMBER }}>Entorno de pruebas</strong> — Los cambios aquí no afectan el hotel principal.
            Usa este espacio para validar catálogo, furnis y configuraciones antes de producción.
          </div>

          <button
            onClick={launchGame}
            className="btn flex items-center gap-2.5 text-base px-8 py-3"
            style={{
              fontSize: '1rem', borderRadius: 14,
              background: `linear-gradient(135deg,${AMBER},#D97706)`,
              color: '#0B1322',
              boxShadow: `0 0 40px rgba(245,158,11,.4)`,
            }}
          >
            <Play className="w-5 h-5 fill-current" />
            Entrar al Entorno de Desarrollo
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
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Error al iniciar Desarrollo</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {errorMsg || 'No fue posible iniciar el cliente. Asegúrate de que Arcturus Dev esté corriendo en el puerto 2098.'}
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
            <div className="alert-icon" style={{ background: `${AMBER_DIM}`, color: AMBER }}>
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Conexión dev perdida</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                Se perdió la conexión con Arcturus Dev. Verifica que el servidor esté activo en el puerto 2098.
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
        <span>© 2025 Kodexa Hotel · arcturus-dev (preparado)</span>
        <span className="flex items-center gap-1.5">
          <span className="pulse-dot" style={{ background: AMBER }} />
          <span style={{ color: AMBER }}>arcturus-dev engine</span>
        </span>
      </div>
    </div>
  );
}
