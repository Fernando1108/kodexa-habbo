export const metadata = { title: 'Política de Privacidad · Kodexa Hotel' };

const SECTIONS = [
  { id: 'datos',       title: 'Datos que Recopilamos',       content: 'Recopilamos los siguientes datos al registrarte y usar el servicio: nombre de usuario, dirección de email, contraseña (cifrada con bcrypt), dirección IP de registro y acceso, datos de juego (avatar, créditos, inventario, salas), logs de actividad (acciones en el hotel), y datos de navegación básicos para mejorar el servicio.' },
  { id: 'uso',         title: 'Cómo Usamos los Datos',       content: 'Tus datos se usan para: proveer y mejorar el servicio del hotel virtual; proteger la seguridad de la plataforma y detectar fraudes; personalizar tu experiencia de juego; enviarte notificaciones importantes del servicio (sin spam comercial); cumplir con obligaciones legales aplicables.' },
  { id: 'cookies',     title: 'Cookies',                     content: 'Usamos cookies de sesión para mantener tu login activo. No usamos cookies de rastreo de terceros ni publicidad. Puedes desactivar las cookies en tu navegador, aunque esto puede afectar al funcionamiento del servicio.' },
  { id: 'derechos',    title: 'Tus Derechos',                content: 'Tienes derecho a: acceder a tus datos personales; corregir datos incorrectos desde la configuración de cuenta; solicitar la eliminación de tu cuenta y datos (gdpr@kodexa.io); exportar tus datos en formato legible; oponerte al procesamiento de tus datos. Procesamos solicitudes de derechos en un máximo de 30 días.' },
  { id: 'retencion',   title: 'Retención de Datos',          content: 'Mantenemos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, eliminamos tus datos personales en un plazo de 30 días, salvo datos que debamos conservar por obligación legal. Los logs de moderación se conservan durante 2 años para proteger la integridad del servicio.' },
  { id: 'terceros',    title: 'Terceros',                    content: 'No vendemos ni compartimos tus datos personales con terceros con fines comerciales. Podemos compartir datos con: proveedores de infraestructura necesarios para el servicio (hosting, email); autoridades competentes si lo exige la ley; en caso de fusión o adquisición de la empresa (con notificación previa).' },
  { id: 'dpo',         title: 'Contacto DPO',                content: 'Para ejercer tus derechos RGPD o consultas sobre privacidad, contacta con nuestro responsable de protección de datos en: gdpr@kodexa.io. Responderemos en un máximo de 30 días naturales.' },
];

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Política de Privacidad</h1>
        <p className="text-xs text-[#475569] font-mono">Última actualización: 1 de enero de 2025 · Kodexa Hotel</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-8">
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="card">
              <h2 className="text-base font-semibold text-[#F8FAFC] mb-3">{s.title}</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>
        <aside className="hidden lg:block">
          <nav className="sticky top-20 card p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#475569] mb-3">Secciones</p>
            <div className="space-y-1">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                  className="block text-xs text-[#475569] hover:text-primary transition-colors py-1">
                  {s.title}
                </a>
              ))}
            </div>
          </nav>
        </aside>
      </div>
    </main>
  );
}
