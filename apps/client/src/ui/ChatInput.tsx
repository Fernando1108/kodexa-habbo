// apps/client/src/ui/ChatInput.tsx
import { useRef, useState, type KeyboardEvent } from 'react';
import { MessageComposer, IncomingPacketIds } from '@kodexa/protocol';
import { useConnectionStore } from '../store/useConnectionStore';
import { useRoomStore }       from '../stores/useRoomStore';

const MAX_LEN      = 100;
const MAX_PER_SEC  = 3;

export function ChatInput() {
  const [value, setValue]   = useState('');
  const sendTimestamps       = useRef<number[]>([]);
  const { sendPacket }       = useConnectionStore();

  const isRateLimited = (): boolean => {
    const now = Date.now();
    // Remove timestamps older than 1 s
    sendTimestamps.current = sendTimestamps.current.filter(t => now - t < 1000);
    return sendTimestamps.current.length >= MAX_PER_SEC;
  };

  const recordSend = () => {
    sendTimestamps.current.push(Date.now());
  };

  const handleCommand = (cmd: string): void => {
    const parts = cmd.trim().split(/\s+/);
    const name  = parts[0].toLowerCase();

    if (name === 'roomid') {
      console.info('[Command] roomId =', useRoomStore.getState().roomId);
      return;
    }

    if (name === 'sit' || name === 'wave' || name === 'idle') {
      const composer = new MessageComposer(IncomingPacketIds.ROOM_ACTION)
        .writeString(name);
      sendPacket(IncomingPacketIds.ROOM_ACTION, composer);
      return;
    }

    if (name === 'dance') {
      const danceId = parseInt(parts[1] ?? '1', 10);
      const id = Math.min(Math.max(isNaN(danceId) ? 1 : danceId, 1), 4);
      const composer = new MessageComposer(IncomingPacketIds.ROOM_DANCE)
        .writeInt(id);
      sendPacket(IncomingPacketIds.ROOM_DANCE, composer);
      return;
    }
  };

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Command (skips rate limit)
    if (trimmed.startsWith(':')) {
      handleCommand(trimmed.slice(1));
      setValue('');
      return;
    }

    // Rate limit only applies to non-command messages
    if (isRateLimited()) return;

    recordSend();

    // Shout
    if (trimmed.startsWith('!')) {
      const msg = trimmed.slice(1).trim();
      if (!msg) return;
      const composer = new MessageComposer(IncomingPacketIds.ROOM_SHOUT)
        .writeString(msg.slice(0, MAX_LEN));
      sendPacket(IncomingPacketIds.ROOM_SHOUT, composer);
      setValue('');
      return;
    }

    // Normal chat
    const composer = new MessageComposer(IncomingPacketIds.ROOM_CHAT)
      .writeString(trimmed.slice(0, MAX_LEN));
    sendPacket(IncomingPacketIds.ROOM_CHAT, composer);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      position:    'absolute',
      bottom:      12,
      left:        '50%',
      transform:   'translateX(-50%)',
      display:     'flex',
      gap:         6,
      width:       400,
      maxWidth:    'calc(100vw - 24px)',
    }}>
      <input
        value={value}
        onChange={e => setValue(e.target.value.slice(0, MAX_LEN))}
        onKeyDown={onKeyDown}
        placeholder="Escribe un mensaje… (! = gritar, : = comando)"
        style={{
          flex:         1,
          background:   'rgba(15,23,42,0.90)',
          backdropFilter: 'blur(8px)',
          border:       '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          color:        '#f8fafc',
          fontFamily:   "'Sora',sans-serif",
          fontSize:     13,
          padding:      '7px 12px',
          outline:      'none',
        }}
      />
      <button
        onClick={send}
        style={{
          background:   'linear-gradient(180deg,#14E4BB,#00D4AA)',
          color:        '#062A22',
          border:       'none',
          borderRadius: 8,
          fontFamily:   "'Sora',sans-serif",
          fontWeight:   700,
          fontSize:     13,
          padding:      '7px 14px',
          cursor:       'pointer',
        }}
      >
        ↵
      </button>
    </div>
  );
}
