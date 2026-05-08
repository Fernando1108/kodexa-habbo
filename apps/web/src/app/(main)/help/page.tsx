'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, Mail } from 'lucide-react';

interface FaqItem { q: string; a: string }

function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-[#1f2b41]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left gap-4"
          >
            <span className="text-sm font-medium text-[#F8FAFC]">{item.q}</span>
            <ChevronDown size={16} className={`text-[#475569] flex-none transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <p className="text-sm text-[#94A3B8] pb-4 leading-relaxed">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

const SECTIONS = [
  {
    title: 'Primeros pasos',
    items: [
      { q: '¿Cómo me registro?', a: 'Haz click en "Registrarse" en la esquina superior derecha. Solo necesitas un username, email y contraseña. El proceso toma menos de 1 minuto.' },
      { q: '¿Cómo entro al hotel?', a: 'Después de iniciar sesión, ve a tu dashboard y haz click en "Entrar al Hotel". El cliente se carga directamente en tu navegador, sin descargas.' },
      { q: '¿Cómo personalizo mi avatar?', a: 'Dentro del hotel, abre el menú de avatar (icono de personaje en la barra inferior). Puedes cambiar ropa, colores y accesorios con miles de combinaciones.' },
      { q: '¿Cómo creo una sala?', a: 'En el hotel, abre el Navegador de salas y haz click en "Crear sala". Elige un modelo base y personaliza tu espacio.' },
    ],
  },
  {
    title: 'Economía',
    items: [
      { q: '¿Qué son los créditos?', a: 'Los créditos son la moneda principal del hotel. Los usas para comprar muebles en el catálogo o intercambiarlos en el marketplace.' },
      { q: '¿Qué son los pixels?', a: 'Los pixels son una moneda secundaria que se gana por actividad en el hotel. Se usan para comprar ciertos items y desbloquear funciones especiales.' },
      { q: '¿Cómo funciona el marketplace?', a: 'El marketplace te permite comprar y vender muebles con otros jugadores. Los precios los fija la comunidad. El hotel cobra una comisión del 5% en cada venta.' },
      { q: '¿Cómo tradeo con otros usuarios?', a: 'Acércate a otro usuario en el hotel y usa la opción "Tradear" en su menú. Podéis intercambiar items de forma segura con el sistema de confirmación doble.' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { q: '¿Cómo reporto a un usuario?', a: 'Haz click derecho (o long press en móvil) sobre el avatar del usuario y selecciona "Reportar". Describe el problema y el equipo lo revisará.' },
      { q: '¿Qué pasa si me banean?', a: 'Si recibes un ban injusto, puedes apelar contactando al equipo en nuestro Discord. Los bans permanentes solo se aplican por infracciones graves reiteradas.' },
      { q: '¿Cómo protejo mi cuenta?', a: 'Nunca compartas tu contraseña. El equipo de Kodexa NUNCA te pedirá tu contraseña. Usa un email real para poder recuperar tu cuenta si la pierdes.' },
    ],
  },
];

export default function HelpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/help/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={22} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Centro de Ayuda</h1>
        <p className="text-sm text-[#94A3B8]">Encuentra respuestas a las preguntas más frecuentes</p>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6 mb-12">
        {SECTIONS.map((s) => (
          <div key={s.title} className="card">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 font-mono">{s.title}</h2>
            <Accordion items={s.items} />
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Mail size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-[#F8FAFC]">Contactar al Soporte</h2>
            <p className="text-xs text-[#475569]">soporte@kodexa.io · También en Discord</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <p className="text-[#10B981] font-medium mb-1">Mensaje enviado</p>
            <p className="text-sm text-[#475569]">Te responderemos pronto por email.</p>
          </div>
        ) : (
          <form onSubmit={handleContact} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Asunto</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Mensaje</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50 resize-none" />
            </div>
            <button type="submit" disabled={sending}
              className="btn btn-primary py-2 px-6 text-sm disabled:opacity-50">
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
