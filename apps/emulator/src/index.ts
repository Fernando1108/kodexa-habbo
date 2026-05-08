import { GameServer } from './server/GameServer';
import { logger } from './utils/logger';

const HOST  = process.env.EMULATOR_HOST     ?? '0.0.0.0';
const PORT  = parseInt(process.env.EMULATOR_WS_PORT ?? '2096', 10);

logger.info('🏨 Kodexa Hotel Emulator v0.1.0');
logger.info(`🔌 Starting WebSocket on ${HOST}:${PORT}`);

const server = new GameServer({ host: HOST, wsPort: PORT });
server.start();

logger.info(`🔌 WebSocket listening on ${HOST}:${PORT}`);

function shutdown(signal: string): void {
  logger.warn(`${signal} received — shutting down gracefully`);
  server.stop();
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
