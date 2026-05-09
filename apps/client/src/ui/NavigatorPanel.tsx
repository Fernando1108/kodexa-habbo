import { useEffect, useRef } from 'react';
import { MessageComposer, IncomingPacketIds } from '@kodexa/protocol';
import { useNavigatorStore } from '../stores/useNavigatorStore';
import { useConnectionStore } from '../store/useConnectionStore';

export function NavigatorPanel() {
  const { isOpen, query, rooms, loading, closeNavigator, setQuery, setLoading } =
    useNavigatorStore();
  const { sendPacket } = useConnectionStore();
  const searchRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On open (with empty rooms) or on query change → request rooms
  const requestRooms = (q: string) => {
    setLoading(true);
    const composer = new MessageComposer(IncomingPacketIds.NAVIGATOR_SEARCH).writeString(q);
    sendPacket(IncomingPacketIds.NAVIGATOR_SEARCH, composer);
  };

  // Fetch rooms every time panel opens (keeps user count fresh)
  useEffect(() => {
    if (isOpen) {
      console.log('[Navigator] opened — requesting rooms');
      requestRooms(query);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Debounced search on query change
  const handleSearch = (q: string) => {
    setQuery(q);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => requestRooms(q), 350);
  };

  const enterRoom = (roomId: number) => {
    const composer = new MessageComposer(IncomingPacketIds.ROOM_ENTER).writeInt(roomId);
    sendPacket(IncomingPacketIds.ROOM_ENTER, composer);
    closeNavigator();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeNavigator}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 900,
        }}
      />

      {/* Panel */}
      <div style={{
        position:     'fixed',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
        zIndex:       901,
        width:        420,
        maxWidth:     'calc(100vw - 32px)',
        maxHeight:    '70vh',
        display:      'flex',
        flexDirection: 'column',
        background:   '#1e293b',
        border:       '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        boxShadow:    '0 24px 60px rgba(0,0,0,0.6)',
        fontFamily:   "'Sora', Arial, sans-serif",
        overflow:     'hidden',
      }}>

        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 18px 10px',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          flexShrink:     0,
        }}>
          <span style={{ color: '#f8fafc', fontSize: 14, fontWeight: 700 }}>
            🗺️ Navegador de Salas
          </span>
          <button
            onClick={closeNavigator}
            style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 18px 8px', flexShrink: 0 }}>
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar sala..."
            style={{
              width:        '100%',
              boxSizing:    'border-box',
              background:   'rgba(15,23,42,0.8)',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color:        '#f8fafc',
              fontFamily:   "'Sora', Arial, sans-serif",
              fontSize:     12,
              padding:      '8px 12px',
              outline:      'none',
            }}
          />
        </div>

        {/* Room list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '24px 0' }}>
              Cargando salas…
            </div>
          )}

          {!loading && rooms.length === 0 && (
            <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '24px 0' }}>
              No encontramos salas
            </div>
          )}

          {!loading && rooms.map(room => (
            <div
              key={room.id}
              style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                gap:          10,
                padding:      '10px 10px',
                borderRadius: 8,
                marginTop:    4,
                background:   'rgba(255,255,255,0.03)',
                border:       '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#f8fafc', fontSize: 13, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {room.name}
                </div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                  {room.ownerName ? `${room.ownerName} · ` : ''}
                  {room.users}/{room.capacity} usuarios
                  {room.description ? ` · ${room.description}` : ''}
                </div>
              </div>

              {/* User count badge */}
              <div style={{
                background:   'rgba(0,212,170,0.1)',
                border:       '1px solid rgba(0,212,170,0.2)',
                borderRadius: 6,
                color:        '#00D4AA',
                fontSize:     11,
                fontWeight:   600,
                padding:      '2px 7px',
                flexShrink:   0,
              }}>
                {room.users}
              </div>

              <button
                onClick={() => enterRoom(room.id)}
                style={{
                  background:   'linear-gradient(180deg,#14E4BB,#00D4AA)',
                  border:       'none',
                  borderRadius: 7,
                  color:        '#062A22',
                  fontFamily:   "'Sora', Arial, sans-serif",
                  fontSize:     12,
                  fontWeight:   700,
                  padding:      '5px 12px',
                  cursor:       'pointer',
                  flexShrink:   0,
                }}
              >
                Entrar
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
