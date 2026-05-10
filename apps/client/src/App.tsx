import { useEffect, useState } from 'react';
import { MessageComposer, IncomingPacketIds } from '@kodexa/protocol';
import { useConnectionStore } from './store/useConnectionStore';
import { useUserStore  } from './stores/useUserStore';
import { useRoomStore  } from './stores/useRoomStore';
import { sanitizeWsUrl } from './config/renderer.config';
import { LoadingScreen } from './ui/LoadingScreen';
import { RoomView      } from './ui/RoomView';

type AppState = 'connecting' | 'connected';

export function App() {
  const [appState,   setAppState]  = useState<AppState>('connecting');
  const [loadProgress, setProgress] = useState(0);

  const { status, error, sendPacket } = useConnectionStore();
  const { username }                  = useUserStore();
  const { roomId }                    = useRoomStore();

  // Fake progress bar while connecting/authenticating
  useEffect(() => {
    if (appState !== 'connecting') return;
    const id = setInterval(() => {
      setProgress(p => { if (p >= 85) { clearInterval(id); return p; } return p + Math.random() * 8; });
    }, 300);
    return () => clearInterval(id);
  }, [appState]);

  // Read SSO ticket + optional ?ws= override from URL, connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get('sso');
    // ?ws= injected by HotelBetaClient iframe src — sanitized to only allow ws:// or wss://
    const wsUrl  = sanitizeWsUrl(params.get('ws'));

    if (ticket) {
      // Guard: only connect once (Strict Mode mounts effect twice in dev)
      if (useConnectionStore.getState().status !== 'idle') return;
      // Remove ticket + ws params from URL immediately so a second mount finds nothing
      history.replaceState({}, '', window.location.pathname);
      useConnectionStore.getState().connect(ticket, wsUrl).catch(() => {});
    } else {
      // No SSO ticket — dev/preview mode
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setAppState('connected'), 400);
      }, 1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to connection status
  useEffect(() => {
    if (status === 'connected') {
      setProgress(100);
      setTimeout(() => setAppState('connected'), 400);
    }
  }, [status]);

  const enterRoom = (id: number) => {
    const composer = new MessageComposer(IncomingPacketIds.ROOM_ENTER).writeInt(id);
    sendPacket(IncomingPacketIds.ROOM_ENTER, composer);
  };

  // ── IN-ROOM ──
  if (roomId !== null) {
    return <RoomView />;
  }

  // ── CONNECTING ──
  if (appState === 'connecting') {
    const statusText =
      status === 'authenticating' ? 'Verificando identidad…' :
      status === 'error'          ? (error ?? 'Error de conexión') :
      status === 'connecting'     ? 'Conectando al servidor…' :
                                    'Cargando hotel…';
    return <LoadingScreen progress={Math.min(loadProgress, 95)} statusText={statusText} />;
  }

  // ── CONNECTED LOBBY ──
  return (
    <div style={{
      minHeight:     '100vh',
      background:    '#0F172A',
      display:       'flex',
      alignItems:    'center',
      justifyContent:'center',
      flexDirection: 'column',
      gap:           '1.5rem',
      fontFamily:    "'Sora',sans-serif",
      color:         '#F8FAFC',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
        Kodexa<span style={{ color: '#00D4AA' }}>.</span>Hotel
      </h1>

      {username ? (
        <p style={{ color: '#00D4AA', fontWeight: 600 }}>Conectado como {username}</p>
      ) : (
        <p style={{ color: '#94A3B8' }}>Lobby del hotel</p>
      )}

      <button
        onClick={() => enterRoom(1)}
        style={{
          padding:      '0.75rem 1.5rem',
          background:   'linear-gradient(180deg,#14E4BB,#00D4AA)',
          color:        '#062A22',
          border:       'none',
          borderRadius: 12,
          fontWeight:   600,
          cursor:       'pointer',
          fontFamily:   "'Sora',sans-serif",
          fontSize:     15,
        }}
      >
        Entrar a Sala
      </button>
    </div>
  );
}
