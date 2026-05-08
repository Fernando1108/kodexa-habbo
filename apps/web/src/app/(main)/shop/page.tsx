import Link from 'next/link';
import { ShoppingBag, Gem, Star, Zap, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Tienda · Kodexa Hotel' };

const PACKS = [
  {
    name: 'Starter Pack',
    price: '€4.99',
    credits: 5000,
    pixels: 20000,
    badge: 'STR',
    color: '#3B82F6',
    highlight: false,
    perks: ['5.000 créditos', '20.000 pixels', 'Badge exclusivo STR', '1 item de bienvenida'],
  },
  {
    name: 'Premium Pack',
    price: '€9.99',
    credits: 15000,
    pixels: 60000,
    badge: 'PRE',
    color: '#00D4AA',
    highlight: true,
    perks: ['15.000 créditos', '60.000 pixels', 'Badge exclusivo PRE', '3 items premium', 'Acceso VIP 30 días'],
  },
  {
    name: 'Elite Pack',
    price: '€19.99',
    credits: 40000,
    pixels: 150000,
    badge: 'ELT',
    color: '#F59E0B',
    highlight: false,
    perks: ['40.000 créditos', '150.000 pixels', 'Badge exclusivo ELT', '10 items premium', 'Acceso VIP 90 días', 'Prioridad en soporte'],
  },
];

export default function ShopPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Tienda Kodexa</h1>
        <p className="text-sm text-[#94A3B8]">
          Obtén créditos, pixels y items exclusivos para mejorar tu experiencia
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="card mb-8 text-center py-8 border-dashed" style={{ borderColor: '#334155' }}>
        <Zap size={32} className="text-[#F59E0B] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#F8FAFC] mb-2">Tienda en desarrollo</h2>
        <p className="text-sm text-[#94A3B8] max-w-sm mx-auto">
          Estamos preparando la tienda oficial. Los packs de debajo son una preview de lo que viene pronto.
        </p>
      </div>

      {/* Packs */}
      <div className="grid md:grid-cols-3 gap-6">
        {PACKS.map(pack => (
          <div
            key={pack.name}
            className="card relative flex flex-col"
            style={{
              border: pack.highlight ? `1px solid ${pack.color}40` : undefined,
              background: pack.highlight ? `${pack.color}06` : undefined,
            }}
          >
            {pack.highlight && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
                style={{ background: pack.color, color: '#0F172A' }}
              >
                <Star size={10} className="inline mr-1" />MÁS POPULAR
              </div>
            )}

            <div className="mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: pack.color + '18', border: `1px solid ${pack.color}30` }}
              >
                <Gem size={18} style={{ color: pack.color }} />
              </div>
              <h2 className="font-bold text-[#F8FAFC]">{pack.name}</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold" style={{ color: pack.color }}>{pack.price}</span>
                <span className="text-xs text-[#475569] ml-1">pago único</span>
              </div>
            </div>

            <ul className="space-y-2 flex-1 mb-5">
              {pack.perks.map(perk => (
                <li key={perk} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: pack.color }} />
                  {perk}
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-not-allowed opacity-60"
              style={{ background: pack.color + '20', color: pack.color, border: `1px solid ${pack.color}30` }}
            >
              Próximamente
            </button>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card mt-8 text-center py-6">
        <p className="text-sm text-[#94A3B8] mb-3">
          ¿Quieres ganar créditos gratis? Completa actividades diarias en el hotel.
        </p>
        <Link href="/hotel" className="btn btn-primary inline-flex items-center gap-2 py-2 px-5 text-sm">
          Entrar al hotel <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
