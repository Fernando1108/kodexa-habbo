import { WebSocketServer as WSServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { MessageParser, IncomingPacketIds } from '@kodexa/protocol';
import { SessionManager } from './SessionManager';
import { PacketHandler } from '../protocol/PacketHandler';
import { SSOTicketHandler, purgeStaleBetaDenyEntries, getBetaDenyTrackedCount } from '../protocol/incoming/handshake/SSOTicketHandler';
import { EnterRoomHandler  } from '../protocol/incoming/room/EnterRoomHandler';
import { MoveHandler       } from '../protocol/incoming/room/MoveHandler';
import { makeChatHandler         } from '../protocol/incoming/room/ChatHandler';
import { NavigatorSearchHandler  } from '../protocol/incoming/navigator/NavigatorSearchHandler';
import { MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import { roomManager } from '../game/RoomManager';
import { logger } from '../utils/logger';

const HEARTBEAT_INTERVAL_MS = 30_000;

// ── Connection rate limiting (in-memory, per IP) ─────────────────────────────
const WS_RATE_MAX            = parseInt(process.env.WS_CONNECTION_RATE_LIMIT_MAX            ?? '20',     10);
const WS_RATE_WINDOW_MS      = parseInt(process.env.WS_CONNECTION_RATE_LIMIT_WINDOW_MS      ?? '60000',  10);
const CLEANUP_INTERVAL_MS    = parseInt(process.env.WS_RATE_LIMIT_CLEANUP_INTERVAL_MS       ?? '300000', 10);

function resolveIp(request: IncomingMessage): string {
  // Prefer X-Forwarded-For when behind Nginx/proxy; fall back to direct socket address
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first?.trim() ?? 'unknown';
  }
  return request.socket.remoteAddress ?? 'unknown';
}

export class WebSocketServer {
  private wss: WSServer | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly sessions = new SessionManager();
  private readonly packetHandler = new PacketHandler();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer:   ReturnType<typeof setInterval> | null = null;
  // Map<ip, connection timestamps[]> — cleared of stale entries periodically
  private readonly connectionRateMap = new Map<string, number[]>();

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.registerHandlers();
  }

  /** Returns true if this IP has exceeded the connection rate limit. */
  private isIpRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = (this.connectionRateMap.get(ip) ?? []).filter(t => now - t < WS_RATE_WINDOW_MS);
    timestamps.push(now);
    this.connectionRateMap.set(ip, timestamps);
    return timestamps.length > WS_RATE_MAX;
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

    this.wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      const ip = resolveIp(request);

      // IP rate limit check — close immediately before creating session
      if (this.isIpRateLimited(ip)) {
        logger.warn(`WS rate limit exceeded: ip=${ip} max=${WS_RATE_MAX}/${WS_RATE_WINDOW_MS}ms — connection rejected`);
        socket.close();
        return;
      }

      const session = this.sessions.createSession(socket, ip);
      logger.info(`New connection ip=${ip} — online: ${this.sessions.getOnlineCount()}`);

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
    this.startRateLimitCleanup();
    logger.info(`WebSocket listening on ${this.host}:${this.port}`);
  }

  /** Purge stale IP entries from connectionRateMap and stale userId entries from betaDenyMap. */
  private purgeStaleConnectionRateEntries(): void {
    const now = Date.now();
    for (const [ip, timestamps] of this.connectionRateMap) {
      const fresh = timestamps.filter(t => now - t < WS_RATE_WINDOW_MS);
      if (fresh.length === 0) this.connectionRateMap.delete(ip);
      else this.connectionRateMap.set(ip, fresh);
    }
    purgeStaleBetaDenyEntries(now);
    logger.debug(
      `Rate map cleanup — connectionTrackedIps=${this.connectionRateMap.size} betaTrackedUsers=${getBetaDenyTrackedCount()}`
    );
  }

  private startRateLimitCleanup(): void {
    this.cleanupTimer = setInterval(() => this.purgeStaleConnectionRateEntries(), CLEANUP_INTERVAL_MS);
  }

  getConnectionTrackedIps(): number {
    return this.connectionRateMap.size;
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
    if (this.cleanupTimer)   clearInterval(this.cleanupTimer);
    this.wss?.close();
    logger.info('WebSocket server stopped');
  }

  getOnlineCount(): number {
    return this.sessions.getOnlineCount();
  }
}
