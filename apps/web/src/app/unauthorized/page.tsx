import Link from 'next/link';

export const metadata = { title: 'Kodexa Hotel · Acceso no autorizado' };

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#F8FAFC',
        fontFamily: 'inherit',
        padding: '2rem',
        textAlign: 'center',
        gap: '1.5rem',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: 'rgba(239,68,68,.12)',
          border: '1px solid rgba(239,68,68,.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}
      >
        🔒
      </div>

      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Acceso no autorizado
        </h1>
        <p style={{ color: '#94A3B8', maxWidth: 360, lineHeight: 1.6 }}>
          No tienes permisos para acceder a esta sección. Si crees que esto es un error,
          contacta con el equipo de Kodexa Hotel.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link
          href="/hotel"
          style={{
            background: '#00D4AA',
            color: '#0F172A',
            padding: '0.625rem 1.5rem',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Ir al Hotel
        </Link>
        <Link
          href="/"
          style={{
            border: '1px solid #334155',
            color: '#94A3B8',
            padding: '0.625rem 1.5rem',
            borderRadius: 10,
            fontWeight: 500,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Inicio
        </Link>
      </div>
    </div>
  );
}
