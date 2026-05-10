'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, CheckCircle, XCircle,
  ArrowLeft, ArrowRight, ShieldCheck, AlertCircle,
} from 'lucide-react';

/* ── Password strength bar ──────────────────────────────── */
function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length as 0 | 1 | 2 | 3 | 4;

  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'] as const;
  const colors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'] as const;

  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {([1, 2, 3, 4] as const).map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i <= score ? colors[score] : '#1E293B' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span style={{ color: password ? colors[score] : '#475569' }}>
          Fuerza: {labels[score]}
        </span>
        <span className="text-[#475569]">tip: usa ! @ #</span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function ResetPasswordPage() {
  const { token }  = useParams<{ token: string }>();
  const router     = useRouter();

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error al restablecer la contraseña');
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0F172A', color: '#F8FAFC' }}>
      {/* Backgrounds */}
      <div className="aurora" style={{ position: 'fixed', width: 620, height: 620, top: -220, left: -180, opacity: .45, zIndex: 0 }} />
      <div className="aurora" style={{ position: 'fixed', width: 560, height: 560, bottom: -220, right: -200, top: 'auto', left: 'auto', opacity: .45, zIndex: 0, background: 'radial-gradient(circle, #7C3AED 0%, transparent 60%)' }} />
      <div className="grid-bg" />
      <div className="stars twinkle" style={{ position: 'fixed', zIndex: 0 }} />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 pt-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="logo-k"><span>K</span></div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">Kodexa<span className="text-primary">.</span></div>
            <div className="text-[10px] uppercase tracking-[.22em] text-muted font-mono">Hotel</div>
          </div>
        </Link>
        <div className="page-toggle">
          <Link href="/login"><button>Iniciar sesión</button></Link>
          <Link href="/register"><button>Crear cuenta</button></Link>
        </div>
        <Link href="/login" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 min-h-[calc(100vh-72px)] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="ornament" style={{ top: -60, right: -50 }}><div className="ring" /></div>

          {/* ── Success ── */}
          {status === 'success' && (
            <>
              <div className="text-center mb-7 page-enter">
                <div className="eyebrow mx-auto">
                  <CheckCircle className="w-3 h-3 text-success" /> Contraseña actualizada
                </div>
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
                  <span className="text-gradient">¡Listo!</span>
                </h1>
                <p className="mt-2 text-sm text-muted">Tu contraseña ha sido cambiada correctamente.</p>
              </div>
              <div className="auth-card page-enter flex flex-col items-center gap-4 text-center" style={{ animationDelay: '.05s' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)' }}>
                  <CheckCircle className="w-7 h-7 text-[#10B981]" />
                </div>
                <p className="text-sm text-muted">Redirigiendo al inicio de sesión…</p>
                <Link href="/login" className="btn btn-primary w-full justify-center">
                  Ir al login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}

          {/* ── Invalid/expired token ── */}
          {status === 'error' && !errorMsg && (
            <>
              <div className="text-center mb-7 page-enter">
                <div className="eyebrow mx-auto" style={{ borderColor: 'rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)', color: '#fca5a5' }}>
                  <XCircle className="w-3 h-3" /> Enlace inválido
                </div>
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
                  Enlace <span style={{ color: '#EF4444' }}>expirado</span>
                </h1>
                <p className="mt-2 text-sm text-muted">Este enlace ya no es válido. Solicita uno nuevo.</p>
              </div>
              <div className="auth-card page-enter" style={{ animationDelay: '.05s' }}>
                <Link href="/forgot-password" className="btn btn-primary w-full justify-center">
                  Solicitar nuevo enlace <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-white transition mt-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

          {/* ── Form (idle or error with message) ── */}
          {(status === 'idle' || (status === 'error' && !!errorMsg)) && (
            <>
              <div className="text-center mb-7 page-enter">
                <div className="eyebrow mx-auto">
                  <Lock className="w-3 h-3" /> Nueva contraseña
                </div>
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
                  Elige tu <span className="text-gradient">contraseña</span>
                </h1>
                <p className="mt-2 text-sm text-muted">Elige una contraseña segura para tu cuenta.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="auth-card page-enter" style={{ animationDelay: '.05s' }}>
                <div className="space-y-4">

                  {/* Password */}
                  <div>
                    <label className="block text-xs uppercase tracking-[.16em] text-muted/80 font-mono mb-1.5">
                      Nueva contraseña
                    </label>
                    <div className={`field${password ? ' has-val' : ''}`}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        value={password}
                        disabled={loading}
                        onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                      />
                      <Lock className="w-4 h-4 ic" />
                      <button type="button" className="toggle" onClick={() => setShowPw(v => !v)} aria-label="mostrar contraseña">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <StrengthBar password={password} />
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-xs uppercase tracking-[.16em] text-muted/80 font-mono mb-1.5">
                      Confirmar contraseña
                    </label>
                    <div className={`field${confirm ? ' has-val' : ''}${errorMsg.includes('coinciden') ? ' error' : ''}`}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Repite la contraseña"
                        autoComplete="new-password"
                        value={confirm}
                        disabled={loading}
                        onChange={e => { setConfirm(e.target.value); setErrorMsg(''); }}
                      />
                      <Lock className="w-4 h-4 ic" />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="err-msg show text-xs text-danger flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" /><span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full mt-2"
                  >
                    {loading
                      ? <><div className="spinner" /><span>Guardando…</span></>
                      : <><span>Establecer nueva contraseña</span><ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-white transition pt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Cancelar y volver al login
                  </Link>
                </div>
              </form>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted/70 font-mono">
            <ShieldCheck className="w-3 h-3 text-success" /> conexión cifrada · auth.kodexahotel.com
          </div>
        </div>
      </main>
    </div>
  );
}
