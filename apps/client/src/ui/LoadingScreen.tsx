interface LoadingScreenProps {
  progress?: number;
  statusText?: string;
}

export function LoadingScreen({ progress = 0, statusText = 'Conectando...' }: LoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'conic-gradient(from 220deg at 50% 50%, #00D4AA, #7C3AED, #F59E0B, #00D4AA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: 'calc(100% - 6px)',
              height: 'calc(100% - 6px)',
              borderRadius: 14,
              background: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8FAFC',
              fontWeight: 800,
              fontSize: '1.5rem',
            }}
          >
            K
          </div>
        </div>
        <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.03em' }}>
          Kodexa<span style={{ color: '#00D4AA' }}>.</span>Hotel
        </div>
        <div
          style={{
            color: '#94A3B8',
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            marginTop: '0.25rem',
          }}
        >
          Next Generation Virtual Hotel
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 280 }}>
        <div
          style={{
            height: 4,
            background: '#1E293B',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00D4AA, #7C3AED)',
              borderRadius: 999,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div
          style={{
            marginTop: '0.75rem',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
          }}
        >
          {statusText}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
