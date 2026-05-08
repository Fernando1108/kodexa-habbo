export const metadata = { title: 'Términos de Servicio · Kodexa Hotel' };

const SECTIONS = [
  { id: 'aceptacion',       title: 'Aceptación de Términos',        content: 'Al acceder o utilizar Kodexa Hotel, aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar el servicio. Kodexa Hotel se reserva el derecho de modificar estos términos en cualquier momento, notificando los cambios a través de la plataforma.' },
  { id: 'registro',         title: 'Registro y Cuentas',            content: 'Para acceder al hotel virtual debes crear una cuenta con información verídica. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta. El equipo de Kodexa nunca te solicitará tu contraseña. Debes tener al menos 13 años para registrarte.' },
  { id: 'conducta',         title: 'Conducta del Usuario',          content: 'Te comprometes a no utilizar el servicio para: acosar, amenazar o intimidar a otros usuarios; distribuir contenido inapropiado, ilegal o ofensivo; intentar acceder a sistemas o cuentas sin autorización; usar scripts o programas externos para manipular el juego; suplantar la identidad de empleados de Kodexa o de otros usuarios.' },
  { id: 'virtual',          title: 'Propiedad Virtual',             content: 'Los créditos, píxeles, muebles y cualquier otro bien virtual no tienen valor monetario real y no son transferibles fuera de la plataforma. Kodexa Hotel se reserva el derecho de modificar, eliminar o ajustar cualquier elemento virtual en cualquier momento. La compra de moneda virtual es final y no reembolsable.' },
  { id: 'moneda',           title: 'Moneda Virtual',                content: 'Los créditos y píxeles son monedas virtuales del juego. No pueden ser vendidos, transferidos o intercambiados por dinero real. Kodexa Hotel puede ajustar las cantidades de moneda virtual por razones de equilibrio del juego. Cualquier intento de transacción de moneda virtual por dinero real está prohibido.' },
  { id: 'moderacion',       title: 'Moderación',                    content: 'El equipo de moderación puede sancionar cuentas que incumplan estos términos. Las sanciones van desde advertencias hasta bans permanentes según la gravedad de la infracción. Las decisiones de moderación pueden apelarse a través de nuestro Discord oficial. Kodexa Hotel no está obligado a mantener cuentas sancionadas activas.' },
  { id: 'privacidad',       title: 'Privacidad',                    content: 'El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, que forma parte de estos términos. Recopilamos únicamente los datos necesarios para proveer el servicio y no vendemos información personal a terceros.' },
  { id: 'responsabilidad',  title: 'Limitación de Responsabilidad', content: 'Kodexa Hotel se provee "tal cual" sin garantías de ningún tipo. No somos responsables de pérdidas de datos, interrupciones del servicio, o daños derivados del uso de la plataforma. La responsabilidad máxima de Kodexa Hotel no excederá el importe pagado por el usuario en los últimos 3 meses.' },
  { id: 'modificaciones',   title: 'Modificaciones del Servicio',   content: 'Kodexa Hotel puede modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento. Notificaremos cambios significativos con al menos 7 días de antelación a través de la plataforma o por email.' },
  { id: 'contacto',         title: 'Contacto',                      content: 'Para preguntas sobre estos términos, contacta con nosotros en legal@kodexa.io o a través de nuestro Discord oficial. Nuestro equipo responderá en un plazo de 5-7 días hábiles.' },
];

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Términos de Servicio</h1>
        <p className="text-xs text-[#475569] font-mono">Última actualización: 1 de enero de 2025 · Kodexa Hotel</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-8">
        {/* Content */}
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="card">
              <h2 className="text-base font-semibold text-[#F8FAFC] mb-3">{s.title}</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>

        {/* Sidebar nav */}
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
