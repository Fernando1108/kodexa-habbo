'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un email válido');
      return;
    }
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success — anti-enumeration
      setSent(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
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

      {/* Form */}
      <main className="relative z-10 min-h-[calc(100vh-72px)] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="ornament" style={{ top: -60, right: -50 }}><div className="ring" /></div>

          <div className="text-center mb-7 page-enter">
            <div className="eyebrow mx-auto">
              <Mail className="w-3 h-3" /> Recuperar acceso
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
              <span className="text-gradient">Recuperar</span> contraseña
            </h1>
            <p className="mt-2 text-sm text-muted">
              {sent
                ? 'Revisa tu bandeja de entrada.'
                : 'Te enviamos un enlace para restablecer tu contraseña.'}
            </p>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="auth-card page-enter flex flex-col items-center gap-4 text-center" style={{ animationDelay: '.05s' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)' }}>
                <CheckCircle className="w-7 h-7 text-[#10B981]" />
              </div>
              <div>
                <p className="font-semibold text-[#F8FAFC] text-lg">Correo enviado</p>
                <p className="text-sm text-muted mt-1 leading-relaxed">
                  Si existe una cuenta con ese email, recibirás el enlace en los próximos minutos.
                  Revisa también tu carpeta de spam.
                </p>
              </div>
              <Link href="/login" className="btn btn-primary w-full justify-center mt-2">
                Volver al inicio de sesión <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                className="text-sm text-muted hover:text-white transition"
                onClick={() => { setSent(false); setEmail(''); }}
              >
                Intentar con otro email
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate className="auth-card page-enter" style={{ animationDelay: '.05s' }}>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs uppercase tracking-[.16em] text-muted/80 font-mono mb-1.5">
                    Email de tu cuenta
                  </label>
                  <div className={`field${error ? ' error' : ''}${email ? ' has-val' : ''}`}>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={email}
                      disabled={loading}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                    />
                    <Mail className="w-4 h-4 ic" />
                  </div>
                  {error && (
                    <div className="err-msg show text-xs text-danger flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" /><span>{error}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full mt-2"
                >
                  {loading
                    ? <><div className="spinner" /><span>Enviando…</span></>
                    : <><span>Enviar instrucciones</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-white transition pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted/70 font-mono">
            <ShieldCheck className="w-3 h-3 text-success" /> conexión cifrada · auth.kodexahotel.com
          </div>
        </div>
      </main>
    </div>
  );
}
