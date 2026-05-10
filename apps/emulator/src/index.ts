import { GameServer } from './server/GameServer';
import { HealthServer } from './server/HealthServer';
import { logger } from './utils/logger';

const HOST        = process.env.EMULATOR_HOST ?? '0.0.0.0';
// PORT takes priority (beta script sets it); falls back to EMULATOR_WS_PORT, then default 2096
const PORT        = parseInt(process.env.PORT ?? process.env.EMULATOR_WS_PORT ?? '2096', 10);
const BETA_MODE   = process.env.BETA_MODE === 'true';
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT ?? (BETA_MODE ? '3097' : '3096'), 10);

if (BETA_MODE) {
  logger.info('⚗  Kodexa Custom Emulator — BETA MODE');
  logger.info(`🔒 Founder-only access enforced (rank >= 10)`);
} else {
  logger.info('🏨 Kodexa Hotel Emulator v0.1.0');
}
logger.info(`🔌 Starting WebSocket on ${HOST}:${PORT}`);

const server = new GameServer({ host: HOST, wsPort: PORT });
server.start();

logger.info(`🔌 WebSocket listening on ${HOST}:${PORT}`);

const health = new HealthServer(HEALTH_PORT, server);
health.start();

function shutdown(signal: string): void {
  logger.warn(`${signal} received — shutting down gracefully`);
  health.stop();
  server.stop();
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
