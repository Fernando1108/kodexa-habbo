import { MessageParser, MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import type { GameSession } from '../../../server/SessionManager';
import { prisma } from '../../../database/prisma';
import { logger } from '../../../utils/logger';

export async function SSOTicketHandler(session: GameSession, parser: MessageParser): Promise<void> {
  const ticket = parser.readString();
  logger.debug(`SSO ticket received: ${ticket.substring(0, 8)}...`);

  if (!ticket || ticket.length < 8) {
    sendAuthFail(session, 'Invalid ticket');
    return;
  }

  try {
    const user = await prisma.user.findFirst({
      where: { authTicket: ticket },
      select: { id: true, username: true, look: true, credits: true, pixels: true, rank: true },
    });

    if (!user) {
      logger.warn(`SSO: ticket not found — ${ticket.substring(0, 8)}...`);
      sendAuthFail(session, 'Ticket not found or expired');
      return;
    }

    // Clear ticket (one-time use)
    await prisma.user.update({
      where: { id: user.id },
      data:  { authTicket: '', online: true },
    });

    // Populate session
    session.authenticated = true;
    session.userId         = user.id;
    session.username       = user.username;
    session.look           = user.look;
    session.credits        = user.credits;
    session.pixels         = user.pixels;
    session.rank           = user.rank;

    // AUTH_OK: int(userId) + str(username) + str(look) + int(credits) + int(pixels) + int(rank)
    const ok = new MessageComposer(OutgoingPacketIds.AUTH_OK)
      .writeInt(user.id)
      .writeString(user.username)
      .writeString(user.look)
      .writeInt(user.credits)
      .writeInt(user.pixels)
      .writeInt(user.rank);

    session.socket.send(ok.compose());
    logger.info(`AUTH_OK → userId=${user.id} username=${user.username}`);

  } catch (err) {
    logger.error('SSOTicketHandler DB error:', err);
    sendAuthFail(session, 'Server error');
  }
}

function sendAuthFail(session: GameSession, reason: string): void {
  const fail = new MessageComposer(OutgoingPacketIds.AUTH_FAILED).writeString(reason);
  session.socket.send(fail.compose());
  session.socket.close();
}
