import { MessageParser, MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import type { GameSession } from '../../../server/SessionManager';
import { prisma } from '../../../database/prisma';
import { roomManager } from '../../../game/RoomManager';
import { logger } from '../../../utils/logger';

const ROOM_CAPACITY = 25;

// Fallback rooms when DB has none — dev/MVP only
const FALLBACK_ROOMS = [
  { id: 1, name: 'Sala de Prueba',   ownerName: 'Kodexa', description: 'Sala principal de pruebas' },
  { id: 2, name: 'Lobby Principal',  ownerName: 'Kodexa', description: '' },
  { id: 3, name: 'Cafetería',        ownerName: 'Kodexa', description: '' },
  { id: 4, name: 'Sala de Juegos',   ownerName: 'Kodexa', description: '' },
];

function writeRoom(
  composer: MessageComposer,
  id: number,
  name: string,
  ownerName: string,
  users: number,
  capacity: number,
  description: string,
): void {
  composer
    .writeInt(id)
    .writeString(name)
    .writeString(ownerName)
    .writeInt(users)
    .writeInt(capacity)
    .writeString(description);
}

export async function NavigatorSearchHandler(
  session: GameSession,
  parser:  MessageParser,
): Promise<void> {
  if (!session.authenticated) return;

  const query = parser.readString().trim().toLowerCase();

  try {
    const dbRooms = await prisma.room.findMany({
      where: {
        state: 'open',
        ...(query.length > 0 ? { name: { contains: query } } : {}),
      },
      orderBy: { id: 'asc' },
      take: 50,
    });

    // Use fallback when DB has no rooms
    const useFallback = dbRooms.length === 0 && query.length === 0;
    const fallbackFiltered = useFallback
      ? FALLBACK_ROOMS
      : FALLBACK_ROOMS.filter(r => r.name.toLowerCase().includes(query));

    const rooms    = dbRooms.length > 0 ? null : fallbackFiltered;
    const useDB    = dbRooms.length > 0;
    const count    = useDB ? dbRooms.length : fallbackFiltered.length;

    const composer = new MessageComposer(OutgoingPacketIds.NAVIGATOR_RESULTS).writeInt(count);

    if (useDB) {
      for (const room of dbRooms) {
        writeRoom(
          composer,
          room.id,
          room.name,
          '',
          roomManager.getRoomUsers(room.id).length,
          ROOM_CAPACITY,
          '',
        );
      }
    } else {
      for (const room of fallbackFiltered) {
        writeRoom(
          composer,
          room.id,
          room.name,
          room.ownerName,
          roomManager.getRoomUsers(room.id).length,
          ROOM_CAPACITY,
          room.description,
        );
      }
    }

    session.socket.send(composer.compose());
    logger.debug(`[NavigatorSearch] query="${query}" results=${count} source=${useDB ? 'db' : 'fallback'}`);

  } catch (err) {
    logger.error('NavigatorSearchHandler error:', err);
    const empty = new MessageComposer(OutgoingPacketIds.NAVIGATOR_RESULTS).writeInt(0);
    session.socket.send(empty.compose());
  }
}
