import { MessageParser, MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import type { GameSession } from '../../../server/SessionManager';
import { roomManager } from '../../../game/RoomManager';
import { logger } from '../../../utils/logger';

const MAX_MSG_LEN  = 100;
const MAX_PER_SEC  = 3;
const RATE_WINDOW  = 1_000; // ms

const WORDFILTER = ['badword1', 'badword2']; // expand as needed

function isBlocked(word: string): boolean {
  const lower = word.toLowerCase();
  return WORDFILTER.some(w => lower.includes(w));
}

function isRateLimited(session: GameSession): boolean {
  const now = Date.now();
  if (!session.chatTimestamps) session.chatTimestamps = [];
  session.chatTimestamps = session.chatTimestamps.filter(t => now - t < RATE_WINDOW);
  if (session.chatTimestamps.length >= MAX_PER_SEC) return true;
  session.chatTimestamps.push(now);
  return false;
}

export function makeChatHandler(chatType: 0 | 1) {
  return async function ChatHandler(
    session: GameSession,
    parser:  MessageParser,
  ): Promise<void> {
    if (!session.authenticated || !session.roomId || !session.userId) return;

    const raw     = parser.readString();
    const message = raw.slice(0, MAX_MSG_LEN).trim();

    if (!message) return;
    if (isBlocked(message)) return;
    if (isRateLimited(session)) {
      logger.debug(`CHAT rate-limited userId=${session.userId}`);
      return;
    }

    const packet = new MessageComposer(OutgoingPacketIds.ROOM_USER_CHAT)
      .writeInt(session.userId)
      .writeString(message)
      .writeInt(chatType)
      .compose();

    roomManager.broadcast(session.roomId, packet);
    logger.debug(`CHAT userId=${session.userId} type=${chatType} msg="${message}"`);
  };
}
