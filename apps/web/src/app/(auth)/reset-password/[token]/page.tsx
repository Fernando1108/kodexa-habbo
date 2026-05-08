'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i <= score ? colors[score] : '#1E293B' }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al restablecer la contraseña');
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
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Nueva contraseña</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Elige una contraseña segura para tu cuenta</p>
        </div>

        <div className="card">
          {status === 'success' ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-[#10B981] mx-auto mb-3" />
              <p className="font-semibold text-[#F8FAFC] mb-1">Contraseña actualizada</p>
              <p className="text-sm text-[#94A3B8]">
                Tu contraseña ha sido cambiada correctamente. Redirigiendo al login…
              </p>
              <Link href="/login" className="btn btn-primary w-full mt-6 text-sm py-2">
                Ir al login
              </Link>
            </div>
          ) : status === 'error' && !errorMsg ? (
            <div className="text-center py-4">
              <XCircle size={40} className="text-[#EF4444] mx-auto mb-3" />
              <p className="font-semibold text-[#F8FAFC] mb-1">Enlace inválido o expirado</p>
              <p className="text-sm text-[#94A3B8]">
                Este enlace ya no es válido. Solicita uno nuevo.
              </p>
              <Link href="/forgot-password" className="btn btn-primary w-full mt-6 text-sm py-2">
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#334155] focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Confirmar contraseña</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#334155] focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-[#EF4444]">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {loading ? 'Guardando…' : 'Establecer nueva contraseña'}
              </button>

              <Link
                href="/login"
                className="block text-center text-xs text-[#475569] hover:text-[#94A3B8] transition-colors"
              >
                Cancelar y volver al login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
