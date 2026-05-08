import { MessageParser, MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import type { GameSession } from '../../../server/SessionManager';
import { roomManager } from '../../../game/RoomManager';
import { logger } from '../../../utils/logger';

export async function MoveHandler(
  session: GameSession,
  parser:  MessageParser,
): Promise<void> {
  if (!session.authenticated || !session.roomId) return;

  const tx = parser.readInt();
  const ty = parser.readInt();

  const path = roomManager.moveUser(session, tx, ty);
  if (path.length === 0) return;

  const composer = new MessageComposer(OutgoingPacketIds.ROOM_USER_MOVED)
    .writeInt(session.userId!);

  composer.writeInt(path.length);
  for (const step of path) {
    composer.writeInt(step.x);
    composer.writeInt(step.y);
  }

  const packet = composer.compose();
  roomManager.broadcast(session.roomId, packet);
  logger.debug(`USER_MOVE userId=${session.userId} path=${path.length} steps → (${tx},${ty})`);
}
