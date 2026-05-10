import { createServer, type Server } from 'node:http';
import { logger } from '../utils/logger';
import type { GameServer } from './GameServer';

const BETA_MODE = process.env.BETA_MODE === 'true';

export class HealthServer {
  private readonly server: Server;
  private readonly port: number;
  private readonly startedAt = Date.now();

  constructor(port: number, gameServer: GameServer) {
    this.port = port;
    this.server = createServer((_req, res) => {
      const stats = gameServer.getRateLimitStats();
      const body = JSON.stringify({
        status:      'ok',
        service:     BETA_MODE ? 'kodexa-emulator-beta' : 'kodexa-emulator',
        mode:        BETA_MODE ? 'beta' : 'main',
        uptimeSec:   Math.floor((Date.now() - this.startedAt) / 1000),
        wsPort:      parseInt(process.env.PORT ?? process.env.EMULATOR_WS_PORT ?? '2096', 10),
        onlineCount: gameServer.getOnlineCount(),
        timestamp:   new Date().toISOString(),
        rateLimit: {
          connectionTrackedIps: stats.connectionTrackedIps,
          betaTrackedUsers:     stats.betaTrackedUsers,
        },
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
    });
  }

  start(): void {
    this.server.listen(this.port, () => {
      logger.info(`Health endpoint listening on :${this.port} — GET /health`);
    });
  }

  stop(): void {
    this.server.close();
    logger.info('Health server stopped');
  }
}
