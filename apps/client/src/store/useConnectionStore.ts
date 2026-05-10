import { create } from 'zustand';
import { WebSocketClient } from '../network/WebSocketClient';
import { MessageComposer, MessageParser, IncomingPacketIds, OutgoingPacketIds } from '@kodexa/protocol';
import { SOCKET_URL } from '../config/renderer.config';
// wsUrl resolved at call-site (App.tsx reads ?ws= param at startup)
import { useUserStore } from '../stores/useUserStore';
import { useRoomStore  } from '../stores/useRoomStore';
import { useChatStore       } from '../stores/useChatStore';
import { useNavigatorStore } from '../stores/useNavigatorStore';
import { gameEvents    } from '../utils/gameEvents';
import type { AvatarData } from '../engine/AvatarEntity';

type ConnectionStatus = 'idle' | 'connecting' | 'authenticating' | 'connected' | 'error' | 'disconnected';

interface ConnectionState {
  status: ConnectionStatus;
  error:  string | null;
  client: WebSocketClient | null;
  /** wsUrl overrides the default SOCKET_URL — used by beta hotel (?ws= param) */
  connect:    (ssoTicket: string, wsUrl?: string) => Promise<void>;
  disconnect: () => void;
  sendPacket: (packetId: number, composer: MessageComposer) => void;
}

function readAvatarData(parser: MessageParser): AvatarData {
  return {
    userId:   parser.readInt(),
    username: parser.readString(),
    look:     parser.readString(),
    x:        parser.readInt(),
    y:        parser.readInt(),
    z:        parser.readInt(),
    dir:      parser.readInt(),
  };
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: 'idle',
  error:  null,
  client: null,

  connect: async (ssoTicket: string, wsUrl?: string) => {
    set({ status: 'connecting', error: null });
    const client = new WebSocketClient(wsUrl ?? SOCKET_URL);

    try {
      await client.connect();
      set({ status: 'authenticating', client });

      // Send SSO ticket
      const composer = new MessageComposer(IncomingPacketIds.SSO_TICKET).writeString(ssoTicket);
      client.send(IncomingPacketIds.SSO_TICKET, composer);

      // Central message dispatcher
      client.onMessage((packetId: number, parser: MessageParser) => {
        switch (packetId) {

          case OutgoingPacketIds.AUTH_OK: {
            const userId   = parser.readInt();
            const username = parser.readString();
            const look     = parser.readString();
            const credits  = parser.readInt();
            const pixels   = parser.readInt();
            const rank     = parser.readInt();
            useUserStore.getState().setUser({ userId, username, look, credits, pixels, rank });
            set({ status: 'connected' });
            break;
          }

          case OutgoingPacketIds.AUTH_FAILED: {
            const reason = parser.getRemainingBytes() > 0 ? parser.readString() : 'Authentication failed';
            set({ status: 'error', error: reason, client: null });
            client.disconnect();
            break;
          }

          case OutgoingPacketIds.ROOM_DATA: {
            const roomId    = parser.readInt();
            const name      = parser.readString();
            const heightmap = parser.readString();
            useRoomStore.getState().setRoom(roomId, name, heightmap);
            break;
          }

          case OutgoingPacketIds.ROOM_USERS: {
            const count   = parser.readInt();
            const avatars: AvatarData[] = [];
            for (let i = 0; i < count; i++) avatars.push(readAvatarData(parser));
            useRoomStore.getState().setAvatars(avatars);
            break;
          }

          case OutgoingPacketIds.ROOM_USER_ADDED: {
            const data = readAvatarData(parser);
            useRoomStore.getState().addAvatar(data);
            break;
          }

          case OutgoingPacketIds.ROOM_USER_REMOVED: {
            const userId = parser.readInt();
            useRoomStore.getState().removeAvatar(userId);
            break;
          }

          case OutgoingPacketIds.ROOM_USER_MOVED: {
            const userId     = parser.readInt();
            const pathLength = parser.readInt();
            const path: { x: number; y: number }[] = [];
            for (let i = 0; i < pathLength; i++) {
              path.push({ x: parser.readInt(), y: parser.readInt() });
            }
            const last = path.length > 0 ? path[path.length - 1] : null;
            console.log(`[Movement] USER_MOVED userId=${userId} pathLen=${path.length} to=(${last?.x},${last?.y})`);
            console.log(`[Movement] full path=`, JSON.stringify(path));
            // Animate first (entity reads its own tileX/tileY as start)
            // then update logical store position so syncAvatars has correct data
            gameEvents.emitAvatarMove({ userId, path });
            if (last) useRoomStore.getState().updateAvatarPos(userId, last.x, last.y);
            break;
          }

          case OutgoingPacketIds.ROOM_USER_CHAT: {
            const userId   = parser.readInt();
            const message  = parser.readString();
            const type     = parser.readInt() as 0 | 1 | 2;
            const username = useUserStore.getState().userId === userId
              ? (useUserStore.getState().username ?? '')
              : (useRoomStore.getState().avatars.get(userId)?.username ?? '');
            useChatStore.getState().addMessage({ userId, username, message, type });
            gameEvents.emitChat({ userId, username, message, type });
            break;
          }

          case OutgoingPacketIds.NAVIGATOR_RESULTS: {
            const count = parser.readInt();
            const rooms = [];
            for (let i = 0; i < count; i++) {
              rooms.push({
                id:          parser.readInt(),
                name:        parser.readString(),
                ownerName:   parser.readString(),
                users:       parser.readInt(),
                capacity:    parser.readInt(),
                description: parser.readString(),
              });
            }
            console.log(`[Navigator] results received count=${count}`, rooms.map(r => r.name));
            useNavigatorStore.getState().setRooms(rooms);
            break;
          }

          default:
            break;
        }
      });

      client.onDisconnect(() => {
        set({ status: 'disconnected', client: null });
        useUserStore.getState().reset();
        useRoomStore.getState().clearRoom();
        useChatStore.getState().clearRoom();
      });

    } catch {
      set({ status: 'error', error: 'No se pudo conectar al servidor del juego', client: null });
    }
  },

  disconnect: () => {
    get().client?.disconnect();
    set({ status: 'idle', client: null, error: null });
    useUserStore.getState().reset();
    useRoomStore.getState().clearRoom();
  },

  sendPacket: (packetId, composer) => {
    get().client?.send(packetId, composer);
  },
}));
