import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Gift, Copy, Users, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Referidos · Kodexa Hotel' };

export default async function ReferralPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/referral');

  const refCode = session.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') + '_kodexa';

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
          <Gift size={22} className="text-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Programa de Referidos</h1>
        <p className="text-sm text-[#94A3B8]">
          Invita amigos y gana créditos cuando se registren y sean activos
        </p>
      </div>

      {/* Coming soon */}
      <div className="card mb-6 text-center py-8 border-dashed" style={{ borderColor: '#334155' }}>
        <p className="text-sm text-[#475569] mb-2">Sistema en desarrollo — próximamente</p>
        <p className="text-xs text-[#334155]">Podrás ganar 500 créditos por cada amigo activo que invites</p>
      </div>

      {/* Referral code preview */}
      <div className="card mb-6">
        <h2 className="font-semibold text-[#F8FAFC] mb-4">Tu código de referido</h2>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 px-4 py-3 rounded-xl font-mono text-sm text-[#94A3B8]"
            style={{ background: '#0F172A', border: '1px solid #334155' }}
          >
            {refCode}
          </div>
          <button
            className="btn btn-outline py-3 px-4 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
            disabled
          >
            <Copy size={14} /> Copiar
          </button>
        </div>
        <p className="text-xs text-[#334155] mt-2">* Los códigos se activarán cuando el sistema esté disponible</p>
      </div>

      {/* Rewards */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-primary" />
          <h2 className="font-semibold text-[#F8FAFC]">Recompensas</h2>
        </div>
        <div className="space-y-3">
          {[
            { referrals: 1,  reward: '500 créditos + badge "Recruiter"' },
            { referrals: 5,  reward: '3.000 créditos + 5 items exclusivos' },
            { referrals: 10, reward: '10.000 créditos + badge "Ambassador"' },
            { referrals: 25, reward: '30.000 créditos + item ultra-raro' },
          ].map(tier => (
            <div
              key={tier.referrals}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: '#0F172A', border: '1px solid #1f2b41' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-primary">{tier.referrals}</span>
                <span className="text-xs text-[#475569]">
                  referido{tier.referrals !== 1 ? 's' : ''} activo{tier.referrals !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-[#94A3B8]">{tier.reward}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6 text-center py-6">
        <p className="text-sm text-[#94A3B8] mb-3">Mientras tanto, invita amigos directamente al hotel</p>
        <a href="/hotel" className="btn btn-primary inline-flex items-center gap-2 py-2 px-5 text-sm">
          Entrar al hotel <ArrowRight size={14} />
        </a>
      </div>
    </main>
  );
}
