'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Play, RefreshCw, LogOut, Maximize2, AlertCircle, WifiOff, RotateCcw, Wifi, Construction, AlertTriangle } from 'lucide-react';
import { getAvatarUrl } from '@kodexa/shared';

interface HotelDevUser {
  username: string;
  look:     string;
  credits:  number;
  pixels:   number;
  rank:     number;
}

type LaunchState = 'loading' | 'ready' | 'checking' | 'unavailable' | 'error' | 'disconnected' | 'playing';

const AMBER        = '#F59E0B';
const AMBER_DIM    = 'rgba(245,158,11,.10)';
const AMBER_BORDER = 'rgba(245,158,11,.22)';

const PHASES = [
  'Verificando acceso DEVELOPER / FOUNDER',
  'Comprobando estado de Arcturus Dev',
  'Iniciando entorno de laboratorio',
  'Conectando al servidor dev',
  'Listo',
];

export default function HotelDevClient({ user }: { user: HotelDevUser }) {
  const [state, setState]       = useState<LaunchState>('loading');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const iframeRef   = useRef<HTMLIFrameElement>(null);

  const runBoot = useCallback(() => {
    setState('loading');
    setProgress(0);
    setPhase(0);

    const steps = [
      { pct: 20,  ph: 0, delay: 300 },
      { pct: 45,  ph: 1, delay: 500 },
      { pct: 68,  ph: 2, delay: 400 },
      { pct: 88,  ph: 3, delay: 350 },
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

  // Close settings on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  async function launchGame() {
    setState('checking');
    try {
      const res = await fetch('/api/dev/sso', { method: 'POST' });

      // 503 = arcturus_dev not bootstrapped
      if (res.status === 503) {
        const data = await res.json() as { error: string };
        setErrorMsg(data.error ?? 'Arcturus Dev no está listo. Requiere bootstrap (ver docs/mp-015).');
        setState('unavailable');
        return;
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setErrorMsg(data.error ?? 'Error desconocido al generar ticket dev.');
        setState('error');
        return;
      }

      const data = await res.json() as { ok: boolean; nitroUrl: string };
      setIframeSrc(data.nitroUrl);
      setState('playing');
    } catch {
      setErrorMsg('No se pudo conectar con el servidor. Verifica que Arcturus Dev esté corriendo.');
      setState('error');
    }
  }

  async function reloadHotel() {
    setSettingsOpen(false);
    try {
      const res = await fetch('/api/dev/sso', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json() as { ok: boolean; nitroUrl: string };
      setIframeSrc(data.nitroUrl);
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
        setTimeout(() => {
          if (iframeRef.current) iframeRef.current.src = data.nitroUrl;
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

  const avatarUrl = getAvatarUrl(user.look || 'hd-180-1', { size: 'l', direction: 2, gesture: 'sml' });

  // ── PLAYING ──────────────────────────────────────────────────────────────────
  if (state === 'playing') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0B1322' }}>
        <div className="topbar-game" style={{ borderBottom: `1px solid ${AMBER_BORDER}` }}>
          {/* Logo D */}
          <div
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg,${AMBER},#D97706)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 800, color: '#0B1322',
            }}
          >D</div>
          <span className="text-xs font-bold" style={{ color: '#F8FAFC' }}>
            Kodexa<span style={{ color: AMBER }}>.</span>Dev
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: AMBER_DIM, color: AMBER, fontSize: '0.6rem' }}
          >
            DEV ONLY
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded hidden sm:inline"
            style={{ background: 'rgba(16,185,129,.08)', color: '#10B981', fontSize: '0.6rem', border: '1px solid rgba(16,185,129,.18)' }}
          >
            arcturus_dev
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded hidden md:inline"
            style={{ background: 'rgba(16,185,129,.08)', color: '#10B981', fontSize: '0.6rem', border: '1px solid rgba(16,185,129,.18)' }}
          >
            ws:2097
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Settings dropdown */}
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                title="Configuración"
                onClick={() => setSettingsOpen(o => !o)}
                style={settingsOpen ? { color: AMBER, background: AMBER_DIM } : undefined}
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
                  <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #1f2b41' }}>
                    <div style={{ fontSize: '.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Estado</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', color: '#10B981' }}>
                      <Wifi className="w-3 h-3" /> Conectado (dev)
                    </div>
                  </div>
                  <button onClick={() => void reloadHotel()} style={menuItemStyle}>
                    <RotateCcw className="w-3.5 h-3.5" /> Recargar entorno dev
                  </button>
                  <button onClick={() => { setSettingsOpen(false); toggleFullscreen(); }} style={menuItemStyle}>
                    <Maximize2 className="w-3.5 h-3.5" /> Pantalla completa
                  </button>
                  <div style={{ borderTop: '1px solid #1f2b41', margin: '4px 0' }} />
                  <a href="/desarrollo" style={{ ...menuItemStyle, textDecoration: 'none', display: 'flex' }}>
                    <Construction className="w-3.5 h-3.5" /> Volver a gateway
                  </a>
                  <button
                    onClick={() => { setSettingsOpen(false); void signOut({ callbackUrl: '/login' }); }}
                    style={{ ...menuItemStyle, color: '#f87171' }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Salir
                  </button>
                </div>
              )}
            </div>
            <button onClick={toggleFullscreen} className="icon-btn" title="Pantalla completa">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="icon-btn" title="Salir">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="fullscreen"
          title="Kodexa Dev Hotel"
        />
      </div>
    );
  }

  // ── UNAVAILABLE (arcturus_dev not bootstrapped) ───────────────────────────
  if (state === 'unavailable') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1322' }}>
        <div className="flex flex-col items-center gap-5 text-center" style={{ maxWidth: 420, padding: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle className="w-7 h-7" style={{ color: AMBER }} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Arcturus Dev no está listo</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
              {errorMsg}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full text-left" style={{
            background: 'rgba(19,30,54,.6)', border: '1px solid #1f2b41',
            borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.75rem', color: '#475569',
          }}>
            <div className="font-semibold mb-1" style={{ color: '#64748B' }}>Pasos para habilitar:</div>
            <div>1. Bootstrap de arcturus_dev con schema Arcturus</div>
            <div>2. Verificar ARCTURUS_DEV_DB_URL en .env</div>
            <div>3. Iniciar Nitro Dev en NEXT_PUBLIC_NITRO_DEV_URL</div>
            <div>4. Ver docs/arcturus/mp-015 para instrucciones</div>
          </div>
          <a
            href="/desarrollo"
            className="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: `1px solid ${AMBER_BORDER}`, color: AMBER, textDecoration: 'none' }}
          >
            ← Volver al gateway
          </a>
        </div>
      </div>
    );
  }

  // ── DEFAULT FLOW (loading / ready / error / disconnected) ─────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1322' }}>
      {/* Topbar */}
      <div className="topbar-game" style={{ borderBottom: `1px solid ${AMBER_BORDER}` }}>
        <Construction className="w-5 h-5 flex-none" style={{ color: AMBER }} />
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
          <span className="text-xs hidden sm:block" style={{ color: '#475569' }}>{user.username}</span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="icon-btn" title="Salir">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="aurora a" style={{ opacity: .1, filter: 'hue-rotate(40deg) saturate(1.5)' }} />

        {/* LOADING */}
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
            <p className="text-sm" style={{ color: '#64748B' }}>Cargando entorno Arcturus Dev…</p>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg,${AMBER},#D97706)` }} />
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
        </div>

        {/* READY */}
        <div className={`lstate${(state === 'ready' || state === 'checking') ? ' active' : ''} gap-8 w-full max-w-lg px-6 text-center items-center`}>
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
              Entorno dev listo, <span style={{ color: AMBER }}>{user.username}</span>
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Laboratorio Arcturus Dev · separado del hotel principal</p>
          </div>

          <div style={{
            background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}`,
            borderRadius: 12, padding: '0.75rem 1.25rem',
            fontSize: '0.8rem', color: '#94A3B8', maxWidth: 420, textAlign: 'left',
          }}>
            <AlertTriangle className="w-4 h-4 inline mr-1.5" style={{ color: AMBER }} />
            <strong style={{ color: AMBER }}>Entorno de pruebas</strong> — Los cambios aquí no afectan el hotel principal ni arcturus_main.
          </div>

          <button
            onClick={() => void launchGame()}
            disabled={state === 'checking'}
            className="btn flex items-center gap-2.5 text-base px-8 py-3"
            style={{
              fontSize: '1rem', borderRadius: 14,
              background: state === 'checking' ? '#334155' : `linear-gradient(135deg,${AMBER},#D97706)`,
              color: '#0B1322',
              boxShadow: state === 'checking' ? 'none' : `0 0 40px rgba(245,158,11,.4)`,
              cursor: state === 'checking' ? 'wait' : 'pointer',
            }}
          >
            {state === 'checking'
              ? <><RefreshCw className="w-5 h-5 animate-spin" /> Verificando Arcturus Dev…</>
              : <><Play className="w-5 h-5 fill-current" /> Entrar al Entorno Dev</>
            }
          </button>

          <a href="/desarrollo" style={{ color: '#475569', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Volver al gateway de desarrollo
          </a>
        </div>

        {/* ERROR */}
        <div className={`lstate${state === 'error' ? ' active' : ''} gap-6 px-6`}>
          <div className="alert-card flex flex-col items-center gap-5 text-center" style={{ maxWidth: 400 }}>
            <div className="alert-icon"><AlertCircle className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Error al iniciar Dev</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {errorMsg || 'No fue posible iniciar el entorno dev. Verifica que Arcturus Dev esté corriendo.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={runBoot} className="btn flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />Reintentar
              </button>
              <a href="/desarrollo" className="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #2a3b5b', color: '#94A3B8', textDecoration: 'none' }}>
                Gateway
              </a>
            </div>
          </div>
        </div>

        {/* DISCONNECTED */}
        <div className={`lstate${state === 'disconnected' ? ' active' : ''} gap-6 px-6`}>
          <div className="alert-card flex flex-col items-center gap-5 text-center" style={{ maxWidth: 400 }}>
            <div className="alert-icon" style={{ background: AMBER_DIM, color: AMBER }}>
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F8FAFC' }}>Conexión dev perdida</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                Se perdió la conexión con Arcturus Dev. Verifica que el servidor esté activo.
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
        style={{ borderTop: `1px solid ${AMBER_BORDER}`, color: '#334155' }}
      >
        <span>© 2025 Kodexa Hotel · arcturus-dev</span>
        <span className="flex items-center gap-1.5">
          <span className="pulse-dot" style={{ background: AMBER }} />
          <span style={{ color: AMBER }}>dev engine</span>
        </span>
      </div>
    </div>
  );
}
