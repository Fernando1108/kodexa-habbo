import { MessageParser, MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import type { GameSession } from '../../../server/SessionManager';
import { prisma } from '../../../database/prisma';
import { roomManager, type RoomUser } from '../../../game/RoomManager';
import { logger } from '../../../utils/logger';

const FALLBACK_HEIGHTMAP =
  'xxxxxxxxxx\rx00000000x\rx00000000x\rx00000000x\rx00000000x\rx00000000x\rx00000000x\rxxxxxxxxxx';

function composeUserData(
  composer: MessageComposer,
  session: GameSession,
  x: number, y: number, z: number, dir: number,
): MessageComposer {
  return composer
    .writeInt(session.userId!)
    .writeString(session.username ?? '')
    .writeString(session.look    ?? '')
    .writeInt(x)
    .writeInt(y)
    .writeInt(z)
    .writeInt(dir);
}

export async function EnterRoomHandler(
  session: GameSession,
  parser:  MessageParser,
): Promise<void> {
  if (!session.authenticated) {
    logger.warn('Unauthenticated ROOM_ENTER attempt');
    return;
  }

  const roomId = parser.readInt();

  try {
    let name:       string;
    let heightmap:  string;
    let spawnX = 1;
    let spawnY = 1;

    const room = await prisma.room.findFirst({
      where:  { id: roomId },
      select: { id: true, name: true, model: true },
    });

    if (room) {
      const model = await prisma.roomModel.findUnique({ where: { id: room.model } });
      name      = room.name;
      heightmap = model?.heightmap ?? FALLBACK_HEIGHTMAP;
      if (model) { spawnX = model.doorX; spawnY = model.doorY; }
    } else {
      name      = 'Sala de Prueba';
      heightmap = FALLBACK_HEIGHTMAP;
    }

    // Remove from previous room (if any)
    if (session.roomId && session.roomId !== roomId) {
      const prevUsers = roomManager.getUsersExcept(session.roomId, session.userId!);
      const leaveMsg = new MessageComposer(OutgoingPacketIds.ROOM_USER_REMOVED)
        .writeInt(session.userId!).compose();
      prevUsers.forEach(u => u.session.socket.send(leaveMsg));
      roomManager.removeUser(session);
    }

    session.roomId = roomId;

    // Add user to room
    roomManager.addUser(session, roomId, heightmap, spawnX, spawnY, 2);

    // ── Send ROOM_DATA to entering user ──
    const roomData = new MessageComposer(OutgoingPacketIds.ROOM_DATA)
      .writeInt(roomId)
      .writeString(name)
      .writeString(heightmap);
    session.socket.send(roomData.compose());

    // ── Send current room users (ROOM_USERS) to entering user ──
    const existingUsers = roomManager.getUsersExcept(roomId, session.userId!);
    const usersComposer = new MessageComposer(OutgoingPacketIds.ROOM_USERS)
      .writeInt(existingUsers.length);
    for (const u of existingUsers) {
      composeUserData(usersComposer, u.session, u.x, u.y, u.z, u.dir);
    }
    session.socket.send(usersComposer.compose());

    // ── Broadcast USER_ADDED to existing room users ──
    const addedMsg = composeUserData(
      new MessageComposer(OutgoingPacketIds.ROOM_USER_ADDED),
      session, spawnX, spawnY, session.z ?? 0, 2,
    ).compose();
    existingUsers.forEach((u: RoomUser) => u.session.socket.send(addedMsg));

    // ── Also send USER_ADDED to the entering user (so they see themselves) ──
    session.socket.send(addedMsg);

    logger.info(`ROOM_ENTER → userId=${session.userId} roomId=${roomId} spawn=(${spawnX},${spawnY})`);

  } catch (err) {
    logger.error('EnterRoomHandler error:', err);
  }


}
