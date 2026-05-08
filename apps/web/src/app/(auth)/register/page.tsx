'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Sparkles, UserPlus, User, Mail, Lock, Eye, EyeOff,
  Check, X, ChevronRight, ChevronLeft, AlertCircle,
  ArrowLeft, Play, Coins, Gem,
} from 'lucide-react';
import { getAvatarUrl } from '@kodexa/shared';

/* ── Look building ──────────────────────────────────────── */

// Full Habbo skin palette (palette id=1, selectable colors ordered by display index)
const SKIN_COLORS: { hex: string; code: number }[] = [
  { hex: '#F5DA88', code: 14   },
  { hex: '#FFDBC1', code: 10   },
  { hex: '#FFCB98', code: 1    },
  { hex: '#F4AC54', code: 8    },
  { hex: '#FF987F', code: 12   },
  { hex: '#E0A9A9', code: 1369 },
  { hex: '#CA8154', code: 1370 },
  { hex: '#B87560', code: 19   },
  { hex: '#9C543F', code: 20   },
  { hex: '#904925', code: 1371 },
  { hex: '#4C311E', code: 30   },
  { hex: '#543D35', code: 1372 },
  { hex: '#653A1D', code: 1373 },
  { hex: '#6E392C', code: 21   },
  { hex: '#E3AE7D', code: 2    },
  { hex: '#DFC375', code: 15   },
  { hex: '#C99263', code: 3    },
  { hex: '#A89473', code: 18   },
  { hex: '#C89F56', code: 17   },
  { hex: '#DC9B4C', code: 9    },
  { hex: '#FFB696', code: 11   },
  { hex: '#945C2F', code: 5    },
  { hex: '#AE7748', code: 4    },
  { hex: '#C57040', code: 1388 },
  { hex: '#B88655', code: 1359 },
  { hex: '#D98C63', code: 1389 },
];

const M_OUTFITS = [
  { hr: 'hr-115-42',  ch: 'ch-3030-82',    lg: 'lg-275-1408', sh: 'sh-300-92',  label: 'Casual'    },
  { hr: 'hr-165-37',  ch: 'ch-235-82',     lg: 'lg-220-1408', sh: 'sh-900-92',  label: 'Deportivo' },
  { hr: 'hr-828-36',  ch: 'ch-3030-72',    lg: 'lg-280-64',   sh: 'sh-3002-82', label: 'Cool'      },
  { hr: 'hr-3163-42', ch: 'ch-3122-1408',  lg: 'lg-3023-64',  sh: 'sh-3089-84', label: 'Trendy'    },
  { hr: 'hr-180-45',  ch: 'ch-3028-82',    lg: 'lg-3089-64',  sh: 'sh-3003-82', label: 'Urbano'    },
  { hr: 'hr-100-42',  ch: 'ch-815-82',     lg: 'lg-696-73',   sh: 'sh-725-92',  label: 'Clásico'   },
];

const F_OUTFITS = [
  { hr: 'hr-540-42',  ch: 'ch-635-82',    lg: 'lg-710-1408', sh: 'sh-730-92',  label: 'Casual'   },
  { hr: 'hr-545-37',  ch: 'ch-831-82',    lg: 'lg-716-1408', sh: 'sh-908-92',  label: 'Dulce'    },
  { hr: 'hr-892-42',  ch: 'ch-3025-82',   lg: 'lg-710-1408', sh: 'sh-3016-82', label: 'Elegante' },
  { hr: 'hr-3287-42', ch: 'ch-3122-1408', lg: 'lg-3023-64',  sh: 'sh-3089-84', label: 'Trendy'   },
  { hr: 'hr-515-52',  ch: 'ch-3116-92',   lg: 'lg-3089-64',  sh: 'sh-3003-82', label: 'Cool'     },
  { hr: 'hr-3290-45', ch: 'ch-819-82',    lg: 'lg-710-1408', sh: 'sh-3002-82', label: 'Chic'     },
];

function buildLook(gender: 'M' | 'F', skinCode: number, outfitIdx: number): string {
  const outfits = gender === 'M' ? M_OUTFITS : F_OUTFITS;
  const o       = outfits[outfitIdx] ?? outfits[0];
  const hdId    = gender === 'M' ? 195 : 600;
  return `${o.hr}.hd-${hdId}-${skinCode}.${o.ch}.${o.lg}.${o.sh}`;
}

/* ── Password strength ──────────────────────────────────── */
type StrengthLevel = 0 | 1 | 2 | 3 | 4;
const STRENGTH_META = [
  { label: '—',       color: '#334155' },
  { label: 'Débil',   color: '#EF4444' },
  { label: 'Regular', color: '#F59E0B' },
  { label: 'Buena',   color: '#22c55e' },
  { label: 'Fuerte',  color: '#10B981' },
] as const;

function calcStrength(v: string): StrengthLevel {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 6)  s++;
  if (v.length >= 10) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v))   s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(4, s) as StrengthLevel;
}

/* ── Confetti data ──────────────────────────────────────── */
const CONFETTI_COLORS = ['#00D4AA', '#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'];
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  id:       i,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left:     `${5 + (i * 4.2) % 88}%`,
  delay:    `${(i * 0.13) % 1.8}s`,
  duration: `${2.4 + (i * 0.18) % 1.4}s`,
  size:     `${6 + (i % 4) * 2}px`,
  round:    i % 3 === 0,
}));

/* ── Avatar fallback ──────────────────────────────────────── */
function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.currentTarget as HTMLImageElement).src = '/avatar-placeholder.svg';
  (e.currentTarget as HTMLImageElement).onerror = null;
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter();

  /* Step */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* Step 1 — Avatar */
  const [gender,    setGender]    = useState<'M' | 'F'>('M');
  const [skinIdx,   setSkinIdx]   = useState(0);
  const [outfitIdx, setOutfitIdx] = useState(0);

  /* Step 2 — Form */
  const [username,    setUsername]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms,       setTerms]       = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [uAvail,      setUAvail]      = useState<boolean | null>(null);
  const [uChecking,   setUChecking]   = useState(false);

  /* Step 3 — Success */
  const [doneUser, setDoneUser] = useState('');
  const [doneLook, setDoneLook] = useState('');

  /* Computed */
  const skin    = SKIN_COLORS[skinIdx];
  const look    = buildLook(gender, skin.code, outfitIdx);
  const outfits = gender === 'M' ? M_OUTFITS : F_OUTFITS;

  /* Gender change resets outfit */
  function changeGender(g: 'M' | 'F') {
    setGender(g);
    setOutfitIdx(0);
  }

  /* Username availability debounce */
  useEffect(() => {
    if (username.length < 3 || !/^[A-Za-z0-9_.]{3,20}$/.test(username)) {
      setUAvail(null); return;
    }
    setUChecking(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const d = await r.json() as { available: boolean };
        setUAvail(d.available);
      } catch { setUAvail(null); }
      setUChecking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  /* Validation */
  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(username)) e.username = '3–20 chars · letras, números, _ y .';
    else if (uAvail === false) e.username = 'Ya está en uso';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email no válido';
    if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (confirmPass !== password) e.confirmPass = 'Las contraseñas no coinciden';
    if (!terms) e.terms = 'Debes aceptar los términos';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), email: email.trim(), password, look }),
      });
      const data = await res.json() as { success?: boolean; error?: string; field?: string };
      if (!res.ok) {
        if (data.field) setErrors({ [data.field]: data.error ?? 'Error' });
        else            setErrors({ general: data.error ?? 'Error al crear cuenta' });
        setSubmitting(false);
        return;
      }
      await signIn('credentials', { identifier: username.trim(), password, redirect: false });
      setDoneUser(username.trim());
      setDoneLook(look);
      setStep(3);
    } catch {
      setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
    }
    setSubmitting(false);
  }

  function clearErr(key: string) {
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  }

  const pwStrength = calcStrength(password);
  const pwMeta     = STRENGTH_META[pwStrength];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0F172A', color: '#F8FAFC' }}>

      {/* ── Backgrounds ── */}
      <div className="aurora" style={{ position: 'fixed', width: 600, height: 600, top: -200, left: -160, opacity: .4, zIndex: 0 }} />
      <div className="aurora" style={{ position: 'fixed', width: 500, height: 500, bottom: -200, right: -160, top: 'auto', left: 'auto', opacity: .4, zIndex: 0, background: 'radial-gradient(circle, #7C3AED 0%, transparent 60%)' }} />
      <div className="aurora" style={{ position: 'fixed', width: 340, height: 340, top: '40%', right: '22%', bottom: 'auto', left: 'auto', opacity: .14, zIndex: 0, background: 'radial-gradient(circle, #F59E0B 0%, transparent 60%)' }} />
      <div className="grid-bg" />
      <div className="stars twinkle" style={{ position: 'fixed', zIndex: 0 }} />

      {/* ── Header ── */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 pt-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="logo-k"><span>K</span></div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">Kodexa<span style={{ color: '#00D4AA' }}>.</span></div>
            <div className="text-[10px] uppercase tracking-[.22em] text-[#94A3B8] font-mono">Hotel</div>
          </div>
        </Link>
        <div className="page-toggle">
          <Link href="/login"><button>Iniciar sesión</button></Link>
          <button className="active">Crear cuenta</button>
        </div>
        <Link href="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </header>

      {/* ── Main wizard ── */}
      <main className="relative z-10 flex items-center justify-center px-4 py-10 min-h-[calc(100vh-80px)]">
        <div className="register-wizard w-full max-w-2xl">

          {/* Progress indicator */}
          {step < 3 && (
            <div className="register-progress mb-7">
              <ProgressStep n={1} label="Tu avatar" state={step > 1 ? 'done' : 'active'} />
              <div className="register-progress-line" style={{ background: step > 1 ? '#00D4AA' : '#1f2b41' }} />
              <ProgressStep n={2} label="Tu cuenta" state={step === 2 ? 'active' : step > 2 ? 'done' : 'pending'} />
              <div className="register-progress-line" style={{ background: step > 2 ? '#00D4AA' : '#1f2b41' }} />
              <ProgressStep n={3} label="¡Listo!" state="pending" />
            </div>
          )}

          {/* Card */}
          <div className="auth-card" style={{ maxWidth: '100%', padding: '1.75rem' }}>
            <div key={step} style={{ animation: 'stepEnter .3s cubic-bezier(.2,.7,.3,1) both' }}>

              {/* ══════════ STEP 1: AVATAR ══════════ */}
              {step === 1 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="eyebrow mx-auto inline-flex gap-1.5">
                      <Sparkles className="w-3 h-3" /> Paso 1 de 2
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-[#F8FAFC]">Personaliza tu avatar</h2>
                    <p className="text-sm text-[#94A3B8] mt-1">Así te verán los demás en el hotel</p>
                  </div>

                  <div className="register-step1-grid">

                    {/* Left: Preview */}
                    <div className="register-avatar-preview">
                      <div className="register-avatar-glow" />
                      <img
                        src={getAvatarUrl(look, { size: 'l', direction: 2, gesture: 'std' })}
                        alt="Tu avatar"
                        style={{ height: 220, display: 'block', imageRendering: 'pixelated', position: 'relative', zIndex: 1, margin: '0 auto', filter: 'drop-shadow(0 0 28px rgba(0,212,170,0.45))' }}
                        onError={onImgErr}
                      />
                      <p className="text-[9px] text-[#334155] font-mono mt-2 text-center break-all px-1 max-w-full relative" style={{ zIndex: 1 }}>
                        {look}
                      </p>
                    </div>

                    {/* Right: Options */}
                    <div className="flex flex-col gap-5">

                      {/* Gender */}
                      <div>
                        <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest mb-2">Género</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(['M', 'F'] as const).map(g => (
                            <button
                              key={g} type="button"
                              className={`register-gender-card${gender === g ? ' selected' : ''}`}
                              onClick={() => changeGender(g)}
                            >
                              <img
                                src={getAvatarUrl(buildLook(g, 1, 0), { size: 's', direction: 2 })}
                                alt={g === 'M' ? 'Chico' : 'Chica'}
                                style={{ height: 60, imageRendering: 'pixelated', margin: '0 auto', display: 'block' }}
                                onError={onImgErr}
                              />
                              <span className="text-xs font-semibold mt-1">{g === 'M' ? 'Chico' : 'Chica'}</span>
                              {gender === g && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00D4AA22] flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-[#00D4AA]" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Skin color */}
                      <div>
                        <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest mb-2">Color de piel</p>
                        <div className="flex flex-wrap gap-2">
                          {SKIN_COLORS.map((s, i) => (
                            <button
                              key={i} type="button"
                              className={`register-skin-circle${skinIdx === i ? ' selected' : ''}`}
                              style={{ background: `#${s.hex.replace('#','')}` }}
                              onClick={() => setSkinIdx(i)}
                              aria-label={`Tono ${i + 1}`}
                            >
                              {skinIdx === i && (
                                <Check className="w-3 h-3" style={{ color: [14,10,1,8,15,17,9,11,7,2,13,22,23,24].includes(s.code) ? '#0F172A88' : '#fff8' }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Outfits */}
                      <div>
                        <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest mb-2">Ropa</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {outfits.map((o, i) => (
                            <button
                              key={i} type="button"
                              className={`register-outfit-card${outfitIdx === i ? ' selected' : ''}`}
                              onClick={() => setOutfitIdx(i)}
                            >
                              <img
                                src={getAvatarUrl(buildLook(gender, skin.code, i), { size: 's', direction: 2 })}
                                alt={o.label}
                                style={{ height: 52, imageRendering: 'pixelated', display: 'block', margin: '0 auto' }}
                                onError={onImgErr}
                              />
                              <span className="text-[10px] text-[#64748B] mt-0.5 leading-none">{o.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  <button
                    type="button" onClick={() => setStep(2)}
                    className="btn btn-primary w-full justify-center mt-6 cursor-pointer"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ══════════ STEP 2: ACCOUNT ══════════ */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="eyebrow mx-auto inline-flex gap-1.5">
                      <UserPlus className="w-3 h-3" /> Paso 2 de 2
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-[#F8FAFC]">Datos de tu cuenta</h2>
                    <p className="text-sm text-[#94A3B8] mt-1">Solo necesitas un nombre y una contraseña</p>
                  </div>

                  <div className="max-w-md mx-auto flex flex-col gap-4">

                    {/* Username */}
                    <div>
                      <label className="block text-xs uppercase tracking-[.16em] text-[#94A3B8] font-mono mb-1.5">
                        Nombre de usuario
                      </label>
                      <div className={`field${errors.username ? ' error' : ''}${username ? ' has-val' : ''}`}>
                        <input
                          type="text" placeholder="ej: kodex_nova" maxLength={20}
                          autoComplete="username" value={username}
                          onChange={e => { setUsername(e.target.value); clearErr('username'); }}
                        />
                        <User className="w-4 h-4 ic" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                          {uChecking && (
                            <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                              style={{ borderColor: 'rgba(148,163,184,.25)', borderTopColor: '#94A3B8' }} />
                          )}
                          {!uChecking && uAvail === true  && <Check className="w-4 h-4 text-[#10B981]" />}
                          {!uChecking && uAvail === false && <X    className="w-4 h-4 text-[#EF4444]" />}
                        </span>
                      </div>
                      {!errors.username && uAvail === true  && <p className="text-xs text-[#10B981] mt-1 font-mono">Disponible</p>}
                      {!errors.username && uAvail === false && <p className="text-xs text-[#EF4444] mt-1 font-mono">Ya está en uso</p>}
                      {errors.username && (
                        <div className="err-msg show flex items-center gap-1.5 text-xs text-[#EF4444] mt-1">
                          <AlertCircle className="w-3 h-3" />{errors.username}
                        </div>
                      )}
                      <p className="text-[11px] text-[#475569] mt-1">Tu nombre único en Kodexa Hotel</p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs uppercase tracking-[.16em] text-[#94A3B8] font-mono mb-1.5">Email</label>
                      <div className={`field${errors.email ? ' error' : ''}${email ? ' has-val' : ''}`}>
                        <input
                          type="email" placeholder="tu@email.com" autoComplete="email" value={email}
                          onChange={e => { setEmail(e.target.value); clearErr('email'); }}
                        />
                        <Mail className="w-4 h-4 ic" />
                      </div>
                      {errors.email && (
                        <div className="err-msg show flex items-center gap-1.5 text-xs text-[#EF4444] mt-1">
                          <AlertCircle className="w-3 h-3" />{errors.email}
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs uppercase tracking-[.16em] text-[#94A3B8] font-mono mb-1.5">Contraseña</label>
                      <div className={`field${errors.password ? ' error' : ''}${password ? ' has-val' : ''}`}>
                        <input
                          type={showPass ? 'text' : 'password'} placeholder="mínimo 6 caracteres"
                          autoComplete="new-password" value={password}
                          onChange={e => { setPassword(e.target.value); clearErr('password'); }}
                        />
                        <Lock className="w-4 h-4 ic" />
                        <button type="button" className="toggle cursor-pointer" onClick={() => setShowPass(v => !v)}>
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* 4-segment strength bar */}
                      <div className="register-strength-bar mt-2">
                        {([1, 2, 3, 4] as const).map(n => (
                          <div key={n} style={{
                            background: pwStrength >= n ? pwMeta.color : '#1f2b41',
                            transition:  'background .3s',
                          }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                        <span style={{ color: password ? pwMeta.color : '#475569' }}>
                          Fuerza: {pwMeta.label}
                        </span>
                        <span className="text-[#475569]">tip: usa ! @ #</span>
                      </div>
                      {errors.password && (
                        <div className="err-msg show flex items-center gap-1.5 text-xs text-[#EF4444] mt-1">
                          <AlertCircle className="w-3 h-3" />{errors.password}
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-xs uppercase tracking-[.16em] text-[#94A3B8] font-mono mb-1.5">Confirmar contraseña</label>
                      <div className={`field${errors.confirmPass ? ' error' : ''}${confirmPass ? ' has-val' : ''}`}>
                        <input
                          type={showConfirm ? 'text' : 'password'} placeholder="repite tu contraseña"
                          autoComplete="new-password" value={confirmPass}
                          onChange={e => { setConfirmPass(e.target.value); clearErr('confirmPass'); }}
                        />
                        <Lock className="w-4 h-4 ic" />
                        <button type="button" className="toggle cursor-pointer" onClick={() => setShowConfirm(v => !v)}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPass && (
                        <div className="err-msg show flex items-center gap-1.5 text-xs text-[#EF4444] mt-1">
                          <AlertCircle className="w-3 h-3" />{errors.confirmPass}
                        </div>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="pt-1">
                      <label className="check cursor-pointer">
                        <input
                          type="checkbox" checked={terms}
                          onChange={e => { setTerms(e.target.checked); clearErr('terms'); }}
                        />
                        <span className="box" />
                        <span>
                          Acepto los{' '}
                          <Link href="/legal/terms"   className="text-[#00D4AA] hover:underline">términos y condiciones</Link>
                          {' '}y la{' '}
                          <Link href="/legal/privacy" className="text-[#00D4AA] hover:underline">política de privacidad</Link>
                        </span>
                      </label>
                      {errors.terms && (
                        <div className="err-msg show flex items-center gap-1.5 text-xs text-[#EF4444] mt-1">
                          <AlertCircle className="w-3 h-3" />{errors.terms}
                        </div>
                      )}
                    </div>

                    {errors.general && (
                      <div className="flex items-center gap-1.5 text-xs text-[#EF4444] justify-center">
                        <AlertCircle className="w-3 h-3" />{errors.general}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button" onClick={() => setStep(1)}
                        className="btn btn-outline flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </button>
                      <button
                        type="button" onClick={handleSubmit} disabled={submitting}
                        className="btn btn-primary flex-1 justify-center cursor-pointer"
                      >
                        {submitting
                          ? <><span className="w-4 h-4 border-2 rounded-full animate-spin flex-none"
                              style={{ borderColor: 'rgba(6,42,34,.3)', borderTopColor: '#062A22' }} />
                              <span>Creando...</span></>
                          : <><span>Crear cuenta</span><ChevronRight className="w-4 h-4" /></>
                        }
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* ══════════ STEP 3: SUCCESS ══════════ */}
              {step === 3 && (
                <div className="register-success">

                  {/* Confetti */}
                  <div className="register-confetti" aria-hidden="true">
                    {CONFETTI.map(p => (
                      <div
                        key={p.id}
                        className="register-confetti-piece"
                        style={{
                          background:        p.color,
                          left:              p.left,
                          width:             p.size,
                          height:            p.size,
                          animationDuration: p.duration,
                          animationDelay:    p.delay,
                          borderRadius:      p.round ? '50%' : '2px',
                        }}
                      />
                    ))}
                  </div>

                  {/* Avatar */}
                  <div className="register-success-avatar-wrap">
                    <div className="register-success-avatar-glow" />
                    <img
                      src={getAvatarUrl(doneLook, { size: 'l', direction: 2, gesture: 'std' })}
                      alt={doneUser}
                      style={{ height: 200, imageRendering: 'pixelated', display: 'block', margin: '0 auto', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 32px rgba(0,212,170,0.6))' }}
                      onError={onImgErr}
                    />
                  </div>

                  {/* Text */}
                  <h2 className="text-2xl font-extrabold text-center mt-5 leading-tight">
                    ¡Bienvenido a{' '}
                    <span className="text-gradient">Kodexa Hotel</span>!
                  </h2>
                  <p className="text-xl font-bold text-center mt-1" style={{ color: '#00D4AA' }}>{doneUser}</p>
                  <p className="text-center text-sm text-[#94A3B8] mt-2">Tu aventura comienza ahora</p>

                  {/* Rank badge */}
                  <div className="flex justify-center mt-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(148,163,184,.12)', color: '#94A3B8', border: '1px solid rgba(148,163,184,.25)' }}>
                      Normal
                    </span>
                  </div>

                  {/* Starting stats */}
                  <div className="flex justify-center gap-3 flex-wrap mt-5">
                    <div className="me-banner-stat">
                      <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span className="font-mono font-bold text-[#F59E0B]">5,000</span>
                      <span className="text-[#94A3B8]">créditos</span>
                    </div>
                    <div className="me-banner-stat">
                      <Gem className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span className="font-mono font-bold text-[#7C3AED]">10,000</span>
                      <span className="text-[#94A3B8]">pixels</span>
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="flex flex-col items-center gap-3 mt-7 max-w-xs mx-auto w-full">
                    <Link
                      href="/hotel"
                      className="btn btn-primary w-full justify-center cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" /> Entrar al Hotel
                    </Link>
                    <Link href="/me" className="text-sm text-[#00D4AA] hover:underline transition-colors cursor-pointer">
                      Ir a mi dashboard →
                    </Link>
                  </div>

                  {/* Trust footer */}
                  <div className="mt-7 flex items-center justify-center gap-3 text-xs text-[#475569] font-mono">
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#10B981]" />100% gratis</span>
                    <span className="opacity-40">·</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#10B981]" />sin spam</span>
                    <span className="opacity-40">·</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#10B981]" />cancelable</span>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Already have account */}
          {step < 3 && (
            <p className="text-center text-sm text-[#94A3B8] mt-5">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[#00D4AA] hover:underline font-medium">Inicia sesión</Link>
            </p>
          )}

        </div>
      </main>
    </div>
  );
}

/* ── Progress step bubble ───────────────────────────────── */
function ProgressStep({
  n, label, state,
}: {
  n: number;
  label: string;
  state: 'active' | 'done' | 'pending';
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`register-progress-dot${state === 'active' ? ' active' : state === 'done' ? ' done' : ''}`}>
        {state === 'done' ? <Check className="w-3 h-3" /> : <span className="text-xs font-bold">{n}</span>}
      </div>
      <span
        className="text-[11px] font-mono whitespace-nowrap"
        style={{ color: state === 'active' ? '#F8FAFC' : state === 'done' ? '#00D4AA' : '#475569' }}
      >
        {label}
      </span>
    </div>
  );
}
