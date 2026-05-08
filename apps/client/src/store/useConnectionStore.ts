import { create } from 'zustand';
import { WebSocketClient } from '../network/WebSocketClient';
import { MessageComposer, MessageParser, IncomingPacketIds, OutgoingPacketIds } from '@kodexa/protocol';
import { SOCKET_URL } from '../config/renderer.config';
import { useUserStore } from '../stores/useUserStore';
import { useRoomStore  } from '../stores/useRoomStore';
import { gameEvents    } from '../utils/gameEvents';
import type { AvatarData } from '../engine/AvatarEntity';

type ConnectionStatus = 'idle' | 'connecting' | 'authenticating' | 'connected' | 'error' | 'disconnected';

interface ConnectionState {
  status: ConnectionStatus;
  error:  string | null;
  client: WebSocketClient | null;
  connect:    (ssoTicket: string) => Promise<void>;
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

  connect: async (ssoTicket: string) => {
    set({ status: 'connecting', error: null });
    const client = new WebSocketClient(SOCKET_URL);

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
            // Update final position in store
            if (path.length > 0) {
              const last = path[path.length - 1];
              useRoomStore.getState().updateAvatarPos(userId, last.x, last.y);
            }
            // Trigger animation via event bus
            gameEvents.emitAvatarMove({ userId, path });
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
