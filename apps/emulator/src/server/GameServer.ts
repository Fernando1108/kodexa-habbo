import { WebSocketServer } from './WebSocketServer';
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
}
