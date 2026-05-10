'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  LockKeyhole, UserRound, Lock, Eye, EyeOff,
  ArrowRight, ShieldAlert, AlertCircle, ShieldCheck, ArrowLeft,
  KeyRound, Mail,
} from 'lucide-react';
import { getAvatarUrl, RANK_LABELS, RANK_COLORS } from '@kodexa/shared';

type FormState = 'idle' | 'loading' | 'error' | 'success';
type LoginStep = 'credentials' | 'token';
interface UserPreview { username: string; look: string; rank: number; }

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData]         = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(true);
  const [state, setState]               = useState<FormState>('idle');
  const [errors, setErrors]             = useState<{ identifier?: string; password?: string; general?: string }>({});

  /* 2FA Staff */
  const [loginStep, setLoginStep]       = useState<LoginStep>('credentials');
  const [tokenValue, setTokenValue]     = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [emailHint, setEmailHint]       = useState('');

  /* Avatar preview */
  const [userPreview,     setUserPreview]     = useState<UserPreview | null>(null);
  const [previewVisible,  setPreviewVisible]  = useState(false);
  const [previewLoading,  setPreviewLoading]  = useState(false);

  /* Debounced lookup */
  useEffect(() => {
    const q = formData.identifier.trim();
    if (q.length < 3) {
      setPreviewVisible(false);
      setTimeout(() => setUserPreview(null), 300);
      return;
    }
    setPreviewLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/auth/lookup?q=${encodeURIComponent(q)}`);
        const d = await r.json() as { found: boolean; username?: string; look?: string; rank?: number };
        if (d.found && d.username && d.look && d.rank !== undefined) {
          setUserPreview({ username: d.username, look: d.look, rank: d.rank });
          setPreviewVisible(true);
        } else {
          setPreviewVisible(false);
          setTimeout(() => setUserPreview(null), 300);
        }
      } catch {
        setPreviewVisible(false);
        setTimeout(() => setUserPreview(null), 300);
      }
      setPreviewLoading(false);
    }, 800);
    return () => {
      clearTimeout(t);
      setPreviewLoading(false);
    };
  }, [formData.identifier]);

  function validate() {
    const errs: typeof errors = {};
    if (formData.identifier.trim().length < 3) errs.identifier = 'Mínimo 3 caracteres';
    if (formData.password.length < 6)          errs.password   = 'Mínimo 6 caracteres';
    setErrors(errs);
    return !Object.keys(errs).length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setState('loading');
    try {
      // Step 1: Check if user needs 2FA
      const checkRes = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password:   formData.password,
        }),
      });
      const checkData = await checkRes.json() as {
        needs2fa?: boolean; username?: string; emailHint?: string; error?: string;
      };

      if (!checkRes.ok) {
        setState('error');
        setErrors({ general: checkData.error ?? 'Usuario o contraseña incorrectos' });
        return;
      }

      if (checkData.needs2fa) {
        // Staff user — show token input
        setStaffUsername(checkData.username ?? '');
        setEmailHint(checkData.emailHint ?? '');
        setLoginStep('token');
        setState('idle');
        return;
      }

      // Non-staff — proceed with normal signIn
      await doSignIn();
    } catch {
      setState('error');
      setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
    }
  }

  async function doSignIn() {
    try {
      const res = await signIn('credentials', {
        identifier: formData.identifier.trim(),
        password:   formData.password,
        redirect:   false,
      });
      if (res?.error) {
        setState('error');
        setErrors({ general: 'Usuario o contraseña incorrectos' });
      } else {
        setState('success');
        const cb = new URLSearchParams(window.location.search).get('callbackUrl');
        router.push(cb ?? '/me');
      }
    } catch {
      setState('error');
      setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
    }
  }

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (tokenValue.trim().length !== 6) {
      setErrors({ general: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setState('loading');
    try {
      const verifyRes = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: staffUsername, token: tokenValue.trim() }),
      });
      const verifyData = await verifyRes.json() as { verified?: boolean; error?: string };

      if (!verifyRes.ok || !verifyData.verified) {
        setState('error');
        setErrors({ general: verifyData.error ?? 'Token inválido' });
        return;
      }

      // Token verified — complete signIn
      await doSignIn();
    } catch {
      setState('error');
      setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
    }
  }

  const loading = state === 'loading';
  const success = state === 'success';

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0F172A', color: '#F8FAFC' }}>
      {/* Fixed backgrounds */}
      <div className="aurora" style={{ position: 'fixed', width: 620, height: 620, top: -220, left: -180, opacity: .45, zIndex: 0 }} />
      <div className="aurora" style={{ position: 'fixed', width: 560, height: 560, bottom: -220, right: -200, top: 'auto', left: 'auto', opacity: .45, zIndex: 0, background: 'radial-gradient(circle, #7C3AED 0%, transparent 60%)' }} />
      <div className="aurora" style={{ position: 'fixed', width: 380, height: 380, top: '35%', right: '20%', bottom: 'auto', left: 'auto', opacity: .18, zIndex: 0, background: 'radial-gradient(circle, #F59E0B 0%, transparent 60%)' }} />
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
          <button className="active">Iniciar sesión</button>
          <Link href="/register"><button>Crear cuenta</button></Link>
        </div>
        <Link href="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </header>

      {/* Form */}
      <main className="relative z-10 min-h-[calc(100vh-72px)] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <div className="ornament" style={{ top: -60, right: -50 }}><div className="ring" /></div>

          <div className="text-center mb-7 page-enter">
            <div className="eyebrow mx-auto">
              {loginStep === 'credentials'
                ? <><LockKeyhole className="w-3 h-3" /> Acceso seguro</>
                : <><KeyRound className="w-3 h-3" /> Verificación 2FA</>}
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
              {loginStep === 'credentials'
                ? <><span className="text-gradient">Bienvenido</span> de vuelta</>
                : <><span className="text-gradient">Código</span> de seguridad</>}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {loginStep === 'credentials'
                ? 'Entra al hotel para reanudar tu aventura.'
                : <><Mail className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />Enviamos un código a <strong className="text-white">{emailHint}</strong></>}
            </p>
          </div>

          {loginStep === 'credentials' ? (
          <form onSubmit={handleSubmit} noValidate className="auth-card page-enter" style={{ animationDelay: '.05s' }}>
            <div className="space-y-4">

              {/* Identifier */}
              <div>
                <label className="block text-xs uppercase tracking-[.16em] text-muted/80 font-mono mb-1.5">Username o Email</label>
                <div className={`field${errors.identifier ? ' error' : ''}${formData.identifier ? ' has-val' : ''}`}>
                  <input
                    type="text" autoComplete="username" placeholder="kodex_player"
                    value={formData.identifier} disabled={loading || success}
                    onChange={e => {
                      setFormData(p => ({ ...p, identifier: e.target.value }));
                      setErrors(p => ({ ...p, identifier: undefined }));
                    }}
                  />
                  <UserRound className="w-4 h-4 ic" />
                  {/* Loading indicator while debouncing */}
                  {previewLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="w-3.5 h-3.5 border-2 rounded-full block"
                        style={{ borderColor: 'rgba(148,163,184,.2)', borderTopColor: '#94A3B8', animation: 'spin .7s linear infinite' }} />
                    </span>
                  )}
                </div>
                {errors.identifier && (
                  <div className="err-msg show text-xs text-danger flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /><span>{errors.identifier}</span>
                  </div>
                )}
              </div>

              {/* Avatar Preview — animated slide-down */}
              <div className={`login-avatar-preview${previewVisible ? ' visible' : ' hidden'}`}>
                {userPreview && (
                  <div className="login-avatar-preview-inner">
                    {/* Avatar head */}
                    <div className="login-avatar-preview-avatar">
                      <img
                        src={getAvatarUrl(userPreview.look, { size: 's', direction: 2, gesture: 'std' })}
                        alt={userPreview.username}
                        style={{ height: 52, imageRendering: 'pixelated', display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/avatar-placeholder.svg'; }}
                      />
                    </div>
                    {/* Text */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F8FAFC] leading-tight">
                        ¡Hola, <span style={{ color: '#00D4AA' }}>{userPreview.username}</span>!
                      </p>
                      <div className="mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
                          style={{
                            background: `${RANK_COLORS[userPreview.rank] ?? '#94A3B8'}18`,
                            color:       RANK_COLORS[userPreview.rank]  ?? '#94A3B8',
                            border:      `1px solid ${RANK_COLORS[userPreview.rank] ?? '#94A3B8'}33`,
                          }}
                        >
                          {RANK_LABELS[userPreview.rank] ?? 'Normal'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs uppercase tracking-[.16em] text-muted/80 font-mono mb-1.5">Contraseña</label>
                <div className={`field${errors.password ? ' error' : ''}${formData.password ? ' has-val' : ''}`}>
                  <input
                    type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                    value={formData.password} disabled={loading || success}
                    onChange={e => { setFormData(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: undefined })); }}
                  />
                  <Lock className="w-4 h-4 ic" />
                  <button type="button" className="toggle" onClick={() => setShowPassword(v => !v)} aria-label="mostrar contraseña">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="err-msg show text-xs text-danger flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /><span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="check">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  <span className="box" />
                  Recordarme
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading || success} className="btn btn-primary w-full mt-3"
                style={success ? { background: 'linear-gradient(180deg,#34d399,#10B981)' } : undefined}
              >
                {loading ? <><div className="spinner" /><span>Procesando…</span></> :
                 success  ? <><ShieldCheck className="w-4 h-4" /><span>¡Bienvenido!</span></> :
                            <><span>Iniciar Sesión</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {errors.general && (
                <div className="err-msg show text-xs text-danger flex items-center gap-1.5 justify-center">
                  <ShieldAlert className="w-3 h-3" /><span>{errors.general}</span>
                </div>
              )}
            </div>

            <div className="div-or my-6 font-mono uppercase tracking-[.2em]"><span>o</span></div>

            <button type="button" className="btn btn-outline w-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#7C3AED" aria-hidden="true">
                <path d="M19.27 5.33A18.06 18.06 0 0 0 14.97 4l-.2.39c1.5.34 2.85.93 4.18 1.86A14.4 14.4 0 0 0 9 6.25c-1.78.13-3.6.5-5.27 1.08l-.2-.39c1.32-.4 2.78-.7 4.3-.93C5.95 5.32 4.4 5.66 3 6.13 1.13 9.36.32 12.86.07 16.36c1.7 1.25 3.36 2.05 5 2.55l.65-.92c-.93-.34-1.78-.78-2.6-1.36.22-.16.44-.3.65-.46 3.39 1.6 7.05 1.6 10.4 0 .21.16.43.3.65.46-.82.58-1.7 1.02-2.61 1.36l.65.92c1.64-.5 3.3-1.3 5-2.55-.4-4.05-1.27-7.55-3.59-11.06zM8.52 14.5c-.98 0-1.79-.92-1.79-2.05s.79-2.05 1.79-2.05 1.81.92 1.79 2.05c.02 1.13-.79 2.05-1.79 2.05zm6.96 0c-.98 0-1.79-.92-1.79-2.05s.79-2.05 1.79-2.05 1.81.92 1.79 2.05c0 1.13-.79 2.05-1.79 2.05z"/>
              </svg>
              Continuar con Discord
            </button>

            <p className="mt-6 text-center text-sm text-muted">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">Regístrate aquí</Link>
            </p>
          </form>
          ) : (
          /* ─── 2FA Token Step ─── */
          <form onSubmit={handleTokenSubmit} noValidate className="auth-card page-enter" style={{ animationDelay: '.05s' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[.16em] text-muted/80 font-mono mb-1.5">Código de verificación</label>
                <div className={`field${errors.general ? ' error' : ''}${tokenValue ? ' has-val' : ''}`}>
                  <input
                    type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
                    maxLength={6} value={tokenValue} disabled={loading || success}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTokenValue(v);
                      setErrors({});
                    }}
                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                  <KeyRound className="w-4 h-4 ic" />
                </div>
              </div>

              <p className="text-xs text-muted text-center">
                El código expira en <strong className="text-[#F59E0B]">5 minutos</strong>. Revisa tu bandeja de entrada y spam.
              </p>

              {/* Submit token */}
              <button
                type="submit" disabled={loading || success || tokenValue.length !== 6} className="btn btn-primary w-full mt-3"
                style={success ? { background: 'linear-gradient(180deg,#34d399,#10B981)' } : undefined}
              >
                {loading ? <><div className="spinner" /><span>Verificando…</span></> :
                 success  ? <><ShieldCheck className="w-4 h-4" /><span>¡Verificado!</span></> :
                            <><span>Verificar código</span><ShieldCheck className="w-4 h-4" /></>}
              </button>

              {errors.general && (
                <div className="err-msg show text-xs text-danger flex items-center gap-1.5 justify-center">
                  <ShieldAlert className="w-3 h-3" /><span>{errors.general}</span>
                </div>
              )}

              {/* Back to credentials */}
              <button
                type="button"
                className="w-full text-center text-sm text-muted hover:text-white transition flex items-center justify-center gap-1.5 mt-2"
                onClick={() => { setLoginStep('credentials'); setTokenValue(''); setErrors({}); setState('idle'); }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
              </button>
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
