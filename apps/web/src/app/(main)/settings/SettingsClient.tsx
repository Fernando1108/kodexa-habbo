'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Shield, Lock, Eye, EyeOff, Check, AlertCircle, ChevronLeft } from 'lucide-react';

interface Props {
  user: { username: string; email: string; motto: string; online: boolean };
}

type Tab = 'general' | 'security' | 'privacy';

function passwordStrength(pw: string): { label: string; pct: number; color: string } {
  if (!pw) return { label: '', pct: 0, color: '#475569' };
  let score = 0;
  if (pw.length >= 8)                    score++;
  if (/[A-Z]/.test(pw))                  score++;
  if (/[0-9]/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))          score++;
  const map = [
    { label: 'Débil',    pct: 25,  color: '#EF4444' },
    { label: 'Regular',  pct: 50,  color: '#F59E0B' },
    { label: 'Buena',    pct: 75,  color: '#00D4AA' },
    { label: 'Fuerte',   pct: 100, color: '#10B981' },
  ];
  return map[Math.max(0, score - 1)]!;
}

export default function SettingsClient({ user }: Props) {
  const [tab, setTab] = useState<Tab>('general');

  // General
  const [motto,    setMotto]    = useState(user.motto);
  const [email,    setEmail]    = useState(user.email);
  const [mottoMsg, setMottoMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [saving,   setSaving]   = useState('');

  // Security
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showPws,    setShowPws]    = useState(false);
  const [pwMsg,      setPwMsg]      = useState('');

  // Privacy
  const [hideOnline, setHideOnline] = useState(!user.online);
  const [privMsg,    setPrivMsg]    = useState('');

  const strength = passwordStrength(newPw);

  async function saveMotto() {
    setSaving('motto');
    const r = await fetch('/api/me/motto', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motto }) });
    setMottoMsg(r.ok ? '✓ Guardado' : 'Error al guardar');
    setSaving('');
    setTimeout(() => setMottoMsg(''), 3000);
  }

  async function saveEmail() {
    if (!email.includes('@')) { setEmailMsg('Email inválido'); return; }
    setSaving('email');
    const r = await fetch('/api/me/email', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const d = await r.json();
    setEmailMsg(r.ok ? '✓ Guardado' : (d.error ?? 'Error'));
    setSaving('');
    setTimeout(() => setEmailMsg(''), 3000);
  }

  async function savePassword() {
    if (newPw !== confirmPw) { setPwMsg('Las contraseñas no coinciden'); return; }
    if (newPw.length < 6)    { setPwMsg('Mínimo 6 caracteres'); return; }
    setSaving('pw');
    const r = await fetch('/api/me/password', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: currentPw, password: newPw }) });
    const d = await r.json();
    if (r.ok) { setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    setPwMsg(r.ok ? '✓ Contraseña actualizada' : (d.error ?? 'Error'));
    setSaving('');
    setTimeout(() => setPwMsg(''), 4000);
  }

  async function savePrivacy() {
    setSaving('priv');
    await fetch('/api/me/privacy', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hideOnline }) });
    setPrivMsg('✓ Guardado');
    setSaving('');
    setTimeout(() => setPrivMsg(''), 3000);
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/me" className="icon-btn"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Configuración</h1>
            <p className="text-sm text-[#94A3B8]">{user.username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl bg-[#0e1627] border border-[#1f2b41]">
          {([
            { id: 'general',  label: 'General',  Icon: User },
            { id: 'security', label: 'Seguridad', Icon: Lock },
            { id: 'privacy',  label: 'Privacidad', Icon: Shield },
          ] as { id: Tab; label: string; Icon: React.FC<{ size: number }> }[]).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-[#131e36] text-[#F8FAFC] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* ── TAB: General ── */}
        {tab === 'general' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest">Perfil</h2>

              <div className="settings-field">
                <label className="settings-label">Motto</label>
                <div className="flex gap-2">
                  <input className="inp flex-1" value={motto} onChange={e => setMotto(e.target.value)} maxLength={127} placeholder="Tu motto..." />
                  <button onClick={saveMotto} disabled={saving === 'motto'}
                    className="btn btn-primary py-2 px-4 text-sm whitespace-nowrap">
                    {saving === 'motto' ? '...' : 'Guardar'}
                  </button>
                </div>
                {mottoMsg && <p className={`text-xs mt-1 ${mottoMsg.startsWith('✓') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{mottoMsg}</p>}
              </div>

              <div className="settings-field">
                <label className="settings-label">Email</label>
                <div className="flex gap-2">
                  <input className="inp flex-1" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  <button onClick={saveEmail} disabled={saving === 'email'}
                    className="btn btn-primary py-2 px-4 text-sm whitespace-nowrap">
                    {saving === 'email' ? '...' : 'Guardar'}
                  </button>
                </div>
                {emailMsg && <p className={`text-xs mt-1 ${emailMsg.startsWith('✓') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{emailMsg}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Security ── */}
        {tab === 'security' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest">Cambiar contraseña</h2>

              <div className="settings-field">
                <label className="settings-label">Contraseña actual</label>
                <div className="relative">
                  <input className="inp pr-10" type={showPws ? 'text' : 'password'}
                    value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                  <button onClick={() => setShowPws(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn text-[#64748B]">
                    {showPws ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">Nueva contraseña</label>
                <input className="inp" type={showPws ? 'text' : 'password'}
                  value={newPw} onChange={e => setNewPw(e.target.value)} />
                {newPw && (
                  <div className="mt-2">
                    <div className="strength mt-1">
                      <div style={{ width: `${strength.pct}%`, backgroundColor: strength.color }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div className="settings-field">
                <label className="settings-label">Confirmar contraseña</label>
                <div className="relative">
                  <input className="inp pr-10" type={showPws ? 'text' : 'password'}
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                  {confirmPw && confirmPw === newPw && (
                    <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10B981]" />
                  )}
                </div>
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 text-xs p-3 rounded-lg ${
                  pwMsg.startsWith('✓')
                    ? 'bg-[#10B98115] text-[#10B981]'
                    : 'bg-[#EF444415] text-[#fca5a5]'
                }`}>
                  {pwMsg.startsWith('✓') ? <Check size={12} /> : <AlertCircle size={12} />}
                  {pwMsg}
                </div>
              )}

              <button onClick={savePassword} disabled={saving === 'pw'}
                className="btn btn-primary w-full justify-center">
                {saving === 'pw' ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">Autenticación 2FA</h2>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0e1829] border border-[#1f2b41]">
                <Shield size={20} className="text-[#475569]" />
                <div>
                  <p className="text-sm text-[#CBD5E1]">Próximamente</p>
                  <p className="text-xs text-[#64748B]">La autenticación de dos factores estará disponible pronto.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Privacy ── */}
        {tab === 'privacy' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest">Privacidad</h2>
              <p className="text-xs text-[#64748B]">Algunos ajustes solo aplican dentro del hotel.</p>

              {[
                { key: 'hideOnline', label: 'Aparecer como desconectado',
                  desc: 'Otros usuarios no verán que estás en línea.', val: hideOnline, set: setHideOnline },
              ].map(({ key, label, desc, val, set }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#CBD5E1]">{label}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => set(v => !v)}
                    className={`settings-toggle ${val ? 'on' : ''}`}
                    aria-checked={val} role="switch">
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              ))}

              {privMsg && <p className="text-xs text-[#10B981]">{privMsg}</p>}

              <button onClick={savePrivacy} disabled={saving === 'priv'}
                className="btn btn-primary w-full justify-center mt-2">
                {saving === 'priv' ? 'Guardando...' : 'Guardar ajustes'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
