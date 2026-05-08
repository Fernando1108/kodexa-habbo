'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Mail size={22} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Recuperar contraseña</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-[#10B981] mx-auto mb-3" />
              <p className="font-semibold text-[#F8FAFC] mb-1">Correo enviado</p>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en los próximos minutos. Revisa también tu carpeta de spam.
              </p>
              <Link href="/login" className="btn btn-outline w-full mt-6 text-sm py-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">
                  Email de tu cuenta
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] placeholder:text-[#334155] focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-xs text-[#475569] hover:text-[#94A3B8] transition-colors pt-1"
              >
                <ArrowLeft size={13} />
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
