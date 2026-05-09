import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { MessageParser, IncomingPacketIds } from '@kodexa/protocol';
import { SessionManager } from './SessionManager';
import { PacketHandler } from '../protocol/PacketHandler';
import { SSOTicketHandler  } from '../protocol/incoming/handshake/SSOTicketHandler';
import { EnterRoomHandler  } from '../protocol/incoming/room/EnterRoomHandler';
import { MoveHandler       } from '../protocol/incoming/room/MoveHandler';
import { makeChatHandler         } from '../protocol/incoming/room/ChatHandler';
import { NavigatorSearchHandler  } from '../protocol/incoming/navigator/NavigatorSearchHandler';
import { MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import { roomManager } from '../game/RoomManager';
import { logger } from '../utils/logger';

const HEARTBEAT_INTERVAL_MS = 30_000;

export class WebSocketServer {
  private wss: WSServer | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly sessions = new SessionManager();
  private readonly packetHandler = new PacketHandler();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.packetHandler.register(IncomingPacketIds.SSO_TICKET, SSOTicketHandler);
    this.packetHandler.register(IncomingPacketIds.ROOM_ENTER,  EnterRoomHandler);
    this.packetHandler.register(IncomingPacketIds.ROOM_MOVE,   MoveHandler);
    this.packetHandler.register(IncomingPacketIds.ROOM_CHAT,       makeChatHandler(0));
    this.packetHandler.register(IncomingPacketIds.ROOM_SHOUT,      makeChatHandler(1));
    this.packetHandler.register(IncomingPacketIds.NAVIGATOR_SEARCH, NavigatorSearchHandler);
  }

  start(): void {
    this.wss = new WSServer({ host: this.host, port: this.port });

    this.wss.on('connection', (socket: WebSocket) => {
      const session = this.sessions.createSession(socket);
      logger.info(`New connection — online: ${this.sessions.getOnlineCount()}`);

      socket.on('message', (data: Buffer) => {
        try {
          const parser = new MessageParser(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
          this.packetHandler.handle(session, parser.getPacketId(), parser);
        } catch (err) {
          logger.error('Failed to parse packet:', err);
        }
      });

      socket.on('close', () => {
        // Broadcast USER_REMOVED to remaining room users before removing session
        if (session.roomId && session.userId) {
          const leaveMsg = new MessageComposer(OutgoingPacketIds.ROOM_USER_REMOVED)
            .writeInt(session.userId).compose();
          roomManager.broadcast(session.roomId, leaveMsg, socket);
          roomManager.removeUser(session);
        }
        this.sessions.removeSession(socket);
        logger.info(`Disconnected — online: ${this.sessions.getOnlineCount()}`);
      });

      socket.on('error', (err) => {
        logger.error('Socket error:', err.message);
      });

      // Mark alive for heartbeat
      (socket as WebSocket & { isAlive: boolean }).isAlive = true;
      socket.on('pong', () => {
        (socket as WebSocket & { isAlive: boolean }).isAlive = true;
      });
    });

    this.startHeartbeat();
    logger.info(`WebSocket listening on ${this.host}:${this.port}`);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.wss?.clients.forEach((socket) => {
        const s = socket as WebSocket & { isAlive: boolean };
        if (!s.isAlive) { s.terminate(); return; }
        s.isAlive = false;
        s.ping();
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.wss?.close();
    logger.info('WebSocket server stopped');
  }

  getOnlineCount(): number {
    return this.sessions.getOnlineCount();
  }
}
