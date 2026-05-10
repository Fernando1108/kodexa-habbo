import { MessageParser, MessageComposer, OutgoingPacketIds } from '@kodexa/protocol';
import type { GameSession } from '../../../server/SessionManager';
import { prisma } from '../../../database/prisma';
import { logger } from '../../../utils/logger';

const BETA_MODE         = process.env.BETA_MODE === 'true';
const BETA_FOUNDER_RANK = parseInt(process.env.BETA_FOUNDER_RANK        ?? '10',    10);

// ── SSO beta deny rate limiting (in-memory, per userId) ──────────────────────
const BETA_DENY_MAX       = parseInt(process.env.BETA_SSO_DENY_LIMIT_MAX       ?? '5',     10);
const BETA_DENY_WINDOW_MS = parseInt(process.env.BETA_SSO_DENY_LIMIT_WINDOW_MS ?? '60000', 10);
const betaDenyMap = new Map<number, number[]>();

/** Purge entries older than the deny window. Call periodically to prevent unbounded growth. */
export function purgeStaleBetaDenyEntries(now = Date.now()): void {
  for (const [userId, timestamps] of betaDenyMap) {
    const fresh = timestamps.filter(t => now - t < BETA_DENY_WINDOW_MS);
    if (fresh.length === 0) betaDenyMap.delete(userId);
    else betaDenyMap.set(userId, fresh);
  }
}

export function getBetaDenyTrackedCount(): number {
  return betaDenyMap.size;
}

function isBetaDenyRateLimited(userId: number): boolean {
  const now = Date.now();
  const timestamps = (betaDenyMap.get(userId) ?? []).filter(t => now - t < BETA_DENY_WINDOW_MS);
  timestamps.push(now);
  betaDenyMap.set(userId, timestamps);
  return timestamps.length > BETA_DENY_MAX;
}

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

    // BETA_MODE: enforce FOUNDER rank
    if (BETA_MODE && user.rank < BETA_FOUNDER_RANK) {
      const ip        = session.ip ?? 'unknown';
      const rateLimited = isBetaDenyRateLimited(user.id);
      const action    = rateLimited ? 'BETA_RANK_DENIED_RATE_LIMITED' : 'BETA_RANK_DENIED';

      logger.warn(
        `${action}: userId=${user.id} username=${user.username} rank=${user.rank} required>=${BETA_FOUNDER_RANK} ip=${ip}`
      );

      // Consume ticket — always, regardless of rate limit — prevents reuse against WS principal
      try {
        await prisma.user.update({
          where: { id: user.id },
          data:  { authTicket: '' },
        });
      } catch (consumeErr) {
        logger.error('BETA: failed to consume ticket on rank denial:', consumeErr);
      }

      // Audit log — fire-and-forget, includes ip and action variant
      prisma.kxActivityLog.create({
        data: {
          userId:  user.id,
          action,
          details: `rank=${user.rank} required>=${BETA_FOUNDER_RANK} ip=${ip}`,
        },
      }).catch((logErr: unknown) => logger.error('BETA: audit log write failed:', logErr));

      sendAuthFail(session, 'Access denied: FOUNDER rank required for Hotel Beta');
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

    if (BETA_MODE) {
      logger.info(`BETA AUTH_OK → userId=${user.id} username=${user.username} rank=${user.rank}`);
    } else {
      logger.info(`AUTH_OK → userId=${user.id} username=${user.username}`);
    }

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
