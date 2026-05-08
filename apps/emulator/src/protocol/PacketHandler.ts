import { MessageParser } from '@kodexa/protocol';
import type { GameSession } from '../server/SessionManager';
import { logger } from '../utils/logger';

type HandlerFn = (session: GameSession, parser: MessageParser) => void | Promise<void>;

export class PacketHandler {
  private handlers = new Map<number, HandlerFn>();

  register(packetId: number, handler: HandlerFn): void {
    this.handlers.set(packetId, handler);
  }

  async handle(session: GameSession, packetId: number, parser: MessageParser): Promise<void> {
    const handler = this.handlers.get(packetId);
    if (!handler) {
      logger.debug(`No handler for packetId ${packetId}`);
      return;
    }
    try {
      await handler(session, parser);
    } catch (err) {
      logger.error(`Error handling packet ${packetId}:`, err);
    }
  }
}
