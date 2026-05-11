import { arcturusDb } from './arcturus-db';

interface KodexaUser {
  id: number;
  username: string;
  email: string;
  rank: number;
  look: string;
  motto: string;
  credits: number;
}

interface ArcturusUser {
  id: number;
  username: string;
}

/**
 * Syncs a kodexa_hotel user to arcturus_main.users.
 * - Matches by email (kodexa.email <-> arcturus.mail).
 * - If user exists: updates rank, look, motto.
 * - If user doesn't exist: inserts with kodexa values as defaults.
 * Returns the arcturus user id.
 */
export async function syncUserToArcturus(user: KodexaUser): Promise<number> {
  const existing = await arcturusDb.$queryRawUnsafe<ArcturusUser[]>(
    'SELECT id, username FROM users WHERE mail = ? LIMIT 1',
    user.email,
  );

  if (existing.length > 0) {
    const arcturusId = existing[0]!.id;
    await arcturusDb.$executeRawUnsafe(
      `UPDATE users SET rank = ?, \`look\` = ?, motto = ? WHERE id = ?`,
      user.rank,
      user.look,
      user.motto,
      arcturusId,
    );
    return arcturusId;
  }

  // New user — insert with safe defaults for arcturus-required fields
  await arcturusDb.$executeRawUnsafe(
    `INSERT INTO users
       (username, mail, password, \`rank\`, \`look\`, gender, motto, credits, account_created, last_online)
     VALUES
       (?, ?, ?, ?, ?, 'M', ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,
    user.username,
    user.email,
    // Placeholder password — SSO never uses it; store a non-empty opaque value
    `kx_sso_${user.id}`,
    user.rank,
    user.look,
    user.motto ?? '',
    user.credits,
  );

  const inserted = await arcturusDb.$queryRawUnsafe<ArcturusUser[]>(
    'SELECT id FROM users WHERE mail = ? LIMIT 1',
    user.email,
  );
  return inserted[0]!.id;
}

/**
 * Writes the SSO ticket to arcturus_main.users.auth_ticket.
 * Called after syncUserToArcturus() so the user is guaranteed to exist.
 */
export async function writeArcturusTicket(arcturusId: number, ticket: string): Promise<void> {
  await arcturusDb.$executeRawUnsafe(
    'UPDATE users SET auth_ticket = ? WHERE id = ?',
    ticket,
    arcturusId,
  );
}
