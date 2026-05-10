import { WebSocketServer } from './WebSocketServer';
import { getBetaDenyTrackedCount } from '../protocol/incoming/handshake/SSOTicketHandler';
import { logger } from '../utils/logger';

interface GameServerOptions {
  host: string;
  wsPort: number;
}

export class GameServer {
  private readonly wsServer: WebSocketServer;

  constructor({ host, wsPort }: GameServerOptions) {
    this.wsServer = new WebSocketServer(host, wsPort);
  }

  start(): void {
    this.wsServer.start();
  }

  stop(): void {
    this.wsServer.stop();
    logger.info('GameServer stopped');
  }

  getOnlineCount(): number {
    return this.wsServer.getOnlineCount();
  }

  getRateLimitStats(): { connectionTrackedIps: number; betaTrackedUsers: number } {
    return {
      connectionTrackedIps: this.wsServer.getConnectionTrackedIps(),
      betaTrackedUsers:     getBetaDenyTrackedCount(),
    };
  }
}
