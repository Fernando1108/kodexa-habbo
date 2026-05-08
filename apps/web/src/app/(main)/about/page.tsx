import Link from 'next/link';
import { Users, Home, ShoppingBag, Sparkles, Cpu, Gem, Package, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Sobre Kodexa Hotel' };

const FEATURES = [
  { icon: <Users size={20} className="text-primary" />,    title: 'Crea tu avatar',          desc: 'Personaliza tu apariencia con miles de combinaciones de ropa, colores y accesorios.' },
  { icon: <Home size={20} className="text-secondary" />,   title: 'Diseña tu habitación',    desc: 'Decora tu sala con +36,000 muebles únicos. Crea el espacio que siempre quisiste.' },
  { icon: <Users size={20} className="text-accent" />,     title: 'Conoce personas',         desc: 'Habla con miles de jugadores de todo el mundo en salas públicas y privadas.' },
  { icon: <ShoppingBag size={20} className="text-primary" />, title: 'Marketplace',          desc: 'Compra y vende muebles con otros jugadores. Los precios los decide la comunidad.' },
  { icon: <Cpu size={20} className="text-secondary" />,    title: 'Wired Visual Scripting',  desc: 'Crea minijuegos complejos con nuestro editor visual de scripting tipo Blueprints.' },
];

const UNIQUES = [
  { icon: <ShoppingBag size={18} />, title: 'Marketplace con Subastas',   desc: 'Sistema de compraventa con subastas en tiempo real y comisiones justas.' },
  { icon: <Sparkles size={18} />,    title: 'NPCs con Inteligencia Artificial', desc: 'Interactúa con NPCs narrativos impulsados por IA que crean quests dinámicas.' },
  { icon: <Gem size={18} />,         title: 'Sistema de Crafteo',          desc: 'Combina muebles para crear objetos únicos que no se pueden comprar en ningún otro lugar.' },
  { icon: <Package size={18} />,     title: '+36,000 Muebles',             desc: 'La biblioteca de muebles más completa de cualquier hotel virtual.' },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="aurora a" style={{ opacity: .15 }} />
        <div className="aurora b" style={{ opacity: .12 }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono mb-6">
            Hotel virtual de nueva generación
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#F8FAFC] mb-4">
            ¿Qué es <span className="text-gradient">Kodexa Hotel</span>?
          </h1>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Un mundo virtual donde puedes ser quien quieras, crear lo que imaginas
            y conectar con personas de todo el planeta — desde cualquier dispositivo.
          </p>
        </div>
      </section>

      {/* Un mundo virtual */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-[#F8FAFC] text-center mb-10">Un mundo virtual</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-[#F8FAFC] mb-2">{f.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Características únicas */}
      <section className="bg-[#1E293B]/40 border-y border-[#1f2b41] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-[#F8FAFC] text-center mb-3">Características únicas</h2>
          <p className="text-sm text-[#94A3B8] text-center mb-10">Lo que hace a Kodexa Hotel diferente</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {UNIQUES.map((u) => (
              <div key={u.title} className="card flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-none text-primary">
                  {u.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#F8FAFC] mb-1">{u.title}</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto text-center px-4 py-20">
        <h2 className="text-2xl font-bold text-[#F8FAFC] mb-3">¿Listo para unirte?</h2>
        <p className="text-[#94A3B8] mb-6">Es completamente gratis. Sin descargas. Directamente en tu navegador.</p>
        <Link href="/register" className="btn btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
          Registrarse gratis <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
