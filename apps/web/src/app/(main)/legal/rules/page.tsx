import Link from 'next/link';
import { Heart, Shield, Camera, ShoppingBag, ShieldOff, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Reglas · Kodexa Hotel' };

const RULES = [
  {
    icon: <Heart size={22} className="text-[#EF4444]" />,
    color: '#EF4444',
    title: 'Respeta a todos',
    items: [
      'No insultes, acoses ni amenaces a otros usuarios.',
      'No hagas discriminación por origen, género, religión u orientación.',
      'El lenguaje ofensivo en chat público está prohibido.',
      'Trata a los demás como quieres que te traten.',
    ],
  },
  {
    icon: <Shield size={22} className="text-[#F59E0B]" />,
    color: '#F59E0B',
    title: 'No hagas trampas',
    items: [
      'Prohibido usar bots, scripts externos o programas de terceros.',
      'No explotes bugs o glitches — repórtalos en /help.',
      'No intentes hackear cuentas ajenas.',
      'No hagas scam ni engañes a otros usuarios en trades.',
    ],
  },
  {
    icon: <Camera size={22} className="text-[#7C3AED]" />,
    color: '#7C3AED',
    title: 'Contenido apropiado',
    items: [
      'Prohibido el contenido adulto o sexual en áreas públicas.',
      'No hagas spam en el chat (mensajes repetitivos).',
      'Los nombres de usuario y salas deben ser apropiados.',
      'Las fotos compartidas deben respetar las normas de la comunidad.',
    ],
  },
  {
    icon: <ShoppingBag size={22} className="text-[#00D4AA]" />,
    color: '#00D4AA',
    title: 'Tradeo seguro',
    items: [
      'Usa siempre el sistema de trade oficial del hotel.',
      'Cualquier acuerdo fuera del sistema de trade no tiene garantías.',
      'Reporta intentos de scam inmediatamente al equipo.',
      'No prometas créditos por acciones fuera del juego.',
    ],
  },
  {
    icon: <ShieldOff size={22} className="text-[#94A3B8]" />,
    color: '#94A3B8',
    title: 'Moderación',
    items: [
      'Las decisiones del equipo de moderación son finales.',
      'Puedes apelar bans en nuestro Discord oficial.',
      'No argumentes con mods en chat público — usa los canales oficiales.',
      'Impersonar a staff de Kodexa es una infracción grave.',
    ],
  },
  {
    icon: <Lock size={22} className="text-[#10B981]" />,
    color: '#10B981',
    title: 'Privacidad',
    items: [
      'No compartas datos personales de otros usuarios sin su consentimiento.',
      'No publiques fotos reales de personas sin permiso.',
      'Protege tus propios datos — no compartas tu contraseña con nadie.',
      'Kodexa Hotel nunca te pedirá tu contraseña.',
    ],
  },
];

const CONSEQUENCES = [
  { level: 'Advertencia',      color: '#F59E0B', desc: 'Primera infracción leve. El usuario es notificado.' },
  { level: 'Mute temporal',    color: '#F59E0B', desc: 'Infracciones repetidas o moderadas. Sin chat por horas/días.' },
  { level: 'Ban temporal',     color: '#EF4444', desc: 'Infracciones graves. Acceso suspendido por días/semanas.' },
  { level: 'Ban permanente',   color: '#EF4444', desc: 'Infracciones muy graves o reiteradas. Sin posibilidad de retorno.' },
];

export default function RulesPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Shield size={22} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">La Manera Kodexa</h1>
        <p className="text-sm text-[#94A3B8] max-w-lg mx-auto">
          Para que todos tengan una experiencia divertida y segura, estas son las reglas de convivencia del hotel.
        </p>
      </div>

      {/* Rules grid */}
      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {RULES.map((rule) => (
          <div key={rule.title} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: rule.color + '15', border: `1px solid ${rule.color}30` }}>
                {rule.icon}
              </div>
              <h2 className="font-semibold text-[#F8FAFC]">{rule.title}</h2>
            </div>
            <ul className="space-y-2">
              {rule.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                  <span className="mt-1.5 w-1 h-1 rounded-full flex-none" style={{ background: rule.color }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Consequences */}
      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle size={16} className="text-[#F59E0B]" />
          <h2 className="font-semibold text-[#F8FAFC]">Consecuencias por Infracciones</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONSEQUENCES.map((c, i) => (
            <div key={c.level} className="text-center p-4 rounded-xl border"
              style={{ borderColor: c.color + '30', background: c.color + '08' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: c.color }}>{i + 1}</div>
              <p className="text-xs font-semibold mb-1" style={{ color: c.color }}>{c.level}</p>
              <p className="text-[11px] text-[#475569] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card text-center py-8">
        <p className="text-sm text-[#94A3B8] mb-4">¿Tienes dudas sobre las reglas o quieres reportar algo?</p>
        <Link href="/help" className="btn btn-primary inline-flex items-center gap-2 py-2 px-6 text-sm">
          Contactar al equipo <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
