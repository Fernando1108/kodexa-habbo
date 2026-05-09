import { useEffect, useRef, useState } from 'react';
import { MessageComposer, IncomingPacketIds } from '@kodexa/protocol';
import { RoomEngine }     from '../engine/RoomEngine';
import { RoomRenderer }   from '../engine/RoomRenderer';
import { AvatarEntity, type AvatarData } from '../engine/AvatarEntity';
import { MovementEngine } from '../engine/MovementEngine';
import { useRoomStore }   from '../stores/useRoomStore';
import { useConnectionStore } from '../store/useConnectionStore';
import { useUserStore }       from '../stores/useUserStore';
import { gameEvents }         from '../utils/gameEvents';
import { ChatInput }          from './ChatInput';
import { NavigatorPanel }     from './NavigatorPanel';
import { useNavigatorStore }  from '../stores/useNavigatorStore';

export function RoomView() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const engineRef      = useRef<RoomEngine    | null>(null);
  const rendererRef    = useRef<RoomRenderer  | null>(null);
  const movementRef    = useRef<MovementEngine>(new MovementEngine());
  const entitiesRef    = useRef<Map<number, AvatarEntity>>(new Map());
  const unsubChatRef   = useRef<(() => void) | null>(null);
  const [, setReady]   = useState(false);

  const { roomName, heightmap }                   = useRoomStore();
  const { sendPacket }                             = useConnectionStore();
  const { openNavigator, isOpen: navigatorOpen }  = useNavigatorStore();

  // ── Bootstrap engine ────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    let unsubAvatars: (() => void) | null = null;

    const engine = new RoomEngine(canvasRef.current);
    engineRef.current = engine;

    engine.ready().then(() => {
      if (cancelled) return;

      const renderer = new RoomRenderer(engine.getWorld());
      rendererRef.current = renderer;

      // Tile click → send MOVE_TO to emulator
      renderer.setOnTileClick((x, y) => {
        // MVP: ignore clicks while self-avatar is animating to prevent snap/cancel churn
        const selfId     = useUserStore.getState().userId;
        const selfEntity = selfId ? entitiesRef.current.get(selfId) : null;
        if (selfEntity?.isMoving) {
          console.log(`[MoveRequestBlocked] reason=avatar_is_moving`);
          return;
        }
        console.log(`[Movement] request ROOM_MOVE x=${x} y=${y}`);
        const composer = new MessageComposer(IncomingPacketIds.ROOM_MOVE)
          .writeInt(x)
          .writeInt(y);
        sendPacket(IncomingPacketIds.ROOM_MOVE, composer);
      });

      const hm = useRoomStore.getState().heightmap;
      if (hm) renderer.renderHeightmap(hm);

      // ── Avatar sync function ──
      const syncAvatars = (avatars: Map<number, AvatarData>) => {
        // Add new entities
        avatars.forEach(data => {
          if (!entitiesRef.current.has(data.userId)) {
            entitiesRef.current.set(
              data.userId,
              new AvatarEntity(data, renderer.getContainer()),
            );
          }
        });

        // Remove stale entities
        entitiesRef.current.forEach((entity, userId) => {
          if (!avatars.has(userId)) {
            entity.destroy();
            entitiesRef.current.delete(userId);
          }
        });
      };

      // Sync avatars already in store (arrived before engine was ready)
      syncAvatars(useRoomStore.getState().avatars);

      // Subscribe for future avatar changes
      unsubAvatars = useRoomStore.subscribe(
        (state) => state.avatars,
        (avatars) => syncAvatars(avatars),
      );

      // Subscribe to chat events → show bubble on correct entity
      unsubChatRef.current = gameEvents.onChat(({ userId, message, type }) => {
        const entity = entitiesRef.current.get(userId);
        entity?.showBubble(message, type);
      });

      setReady(true);
    });

    return () => {
      cancelled = true;
      unsubAvatars?.();
      unsubChatRef.current?.();
      entitiesRef.current.forEach(e => e.destroy());
      entitiesRef.current.clear();
      rendererRef.current?.destroy();
      engine.destroy();
      engineRef.current  = null;
      rendererRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-render heightmap on change ────────────────────────────────────────
  useEffect(() => {
    if (heightmap && rendererRef.current) {
      rendererRef.current.renderHeightmap(heightmap);
    }
  }, [heightmap]);

  // ── Avatar movement animations ────────────────────────────────────────────
  useEffect(() => {
    const unsub = gameEvents.onAvatarMove(({ userId, path }) => {
      const entity  = entitiesRef.current.get(userId);
      const logical = useRoomStore.getState().avatars.get(userId);
      console.log(`[Movement] USER_MOVED userId=${userId} pathLen=${path.length}`);
      if (entity) {
        console.log(`[Movement] visual=(${entity.tileX.toFixed(3)},${entity.tileY.toFixed(3)}) logical=(${logical?.x ?? '?'},${logical?.y ?? '?'}) isMoving=${entity.isMoving}`);
        console.log(`[Movement] zIndex_before=${entity.container.zIndex}`);
      }
      if (entity && path.length > 0) {
        // Store already has final position (set in useConnectionStore).
        // Just animate — no extra updateAvatarPos needed.
        movementRef.current.animateMove(entity, path);
      }
    });
    return unsub;
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f172a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Room HUD */}
      <div style={{
        position:       'absolute', top: 12, left: 12,
        background:     'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
        borderRadius:   10, padding:  '7px 14px', color: '#f8fafc',
        fontFamily:     "'Sora',sans-serif", fontSize: 13, fontWeight: 600,
        border:         '1px solid rgba(255,255,255,0.08)',
        display:        'flex', alignItems: 'center', gap: 10, userSelect: 'none',
      }}>
        <span style={{ color: '#00D4AA', fontSize: 16, fontWeight: 700 }}>K</span>
        <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 11 }}>|</span>
        <span>{roomName || 'Sala'}</span>
        <button
          onClick={openNavigator}
          style={{
            marginLeft: 6, padding: '3px 10px',
            background: navigatorOpen
              ? 'rgba(0,212,170,0.18)'
              : 'rgba(0,212,170,0.08)',
            color: '#00D4AA',
            border: '1px solid rgba(0,212,170,0.25)', borderRadius: 6,
            fontFamily: "'Sora',sans-serif", fontSize: 11, cursor: 'pointer',
          }}
        >
          🗺️ Salas
        </button>
        <button
          onClick={() => useRoomStore.getState().clearRoom()}
          style={{
            padding: '3px 10px',
            background: 'rgba(239,68,68,0.12)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6,
            fontFamily: "'Sora',sans-serif", fontSize: 11, cursor: 'pointer',
          }}
        >
          Salir
        </button>
      </div>

      <NavigatorPanel />
      <ChatInput />

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        color: '#475569', fontFamily: "'Sora',sans-serif",
        fontSize: 10, textAlign: 'right', lineHeight: 1.6, userSelect: 'none',
      }}>
        Click tile para mover · Arrastrar para mover cámara · Scroll para zoom
      </div>
    </div>
  );
}
