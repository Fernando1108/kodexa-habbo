import { arcturusDevDb } from './arcturus-dev-db';
import { ARCTURUS_DEFAULT_LOOK, ARCTURUS_DEFAULT_HOME_ROOM } from './arcturus-sync';

// ── Interfaces ─────────────────────────────────────────────────────────────

interface KodexaUser {
  id:       number;
  username: string;
  email:    string;
  rank:     number;
  look:     string;
  motto:    string;
  credits:  number;
  pixels:   number;
}

interface ArcturusDevUserRow {
  id:        number;
  username:  string;
  home_room: number;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Checks whether arcturus_dev has been bootstrapped (has a `users` table).
 * Returns true if ready, false if empty/missing.
 * Does NOT throw — callers use this to show status without crashing.
 */
export async function isArcturusDevReady(): Promise<boolean> {
  try {
    const rows = await arcturusDevDb.$queryRawUnsafe<{ cnt: number }[]>(
      "SELECT COUNT(*) AS cnt FROM information_schema.tables " +
      "WHERE table_schema = DATABASE() AND table_name = 'users'",
    );
    return Number(rows[0]?.cnt ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Syncs a kodexa_hotel user to arcturus_dev.users.
 *
 * Mirror of syncUserToArcturus() but targets arcturusDevDb.
 * Ticket format: kodexa_dev_<id>_<uuid32> — NEVER written to arcturus_main.
 *
 * Returns the arcturus_dev user id.
 */
export async function syncUserToArcturusDev(user: KodexaUser): Promise<number> {
  const existing = await arcturusDevDb.$queryRawUnsafe<ArcturusDevUserRow[]>(
    'SELECT id, username, home_room FROM users WHERE mail = ? LIMIT 1',
    user.email,
  );

  let arcturusDevId: number;

  if (existing.length > 0) {
    arcturusDevId = existing[0]!.id;

    // kodexa_hotel is source of truth — sync rank/look/motto
    await arcturusDevDb.$executeRawUnsafe(
      'UPDATE users SET `rank` = ?, `look` = ?, motto = ? WHERE id = ?',
      user.rank,
      user.look || ARCTURUS_DEFAULT_LOOK,
      user.motto || '',
      arcturusDevId,
    );

    await _initDevCurrencyRows(arcturusDevId, user.pixels);
  } else {
    // New user in dev — insert with same defaults as main
    await arcturusDevDb.$executeRawUnsafe(
      `INSERT INTO users
         (username, mail, password, \`rank\`, \`look\`, gender, motto,
          credits, home_room, account_created, last_online)
       VALUES
         (?, ?, ?, ?, ?, 'M', ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,
      user.username,
      user.email,
      `kx_dev_sso_${user.id}`,
      user.rank,
      user.look || ARCTURUS_DEFAULT_LOOK,
      user.motto || '',
      user.credits,
      ARCTURUS_DEFAULT_HOME_ROOM,
    );

    const inserted = await arcturusDevDb.$queryRawUnsafe<ArcturusDevUserRow[]>(
      'SELECT id FROM users WHERE mail = ? LIMIT 1',
      user.email,
    );
    if (!inserted[0]) {
      throw new Error(`[arcturus-dev-sync] INSERT failed for email: ${user.email}`);
    }
    arcturusDevId = inserted[0].id;

    await _initDevCurrencyRows(arcturusDevId, user.pixels);
  }

  return arcturusDevId;
}

/**
 * Writes a dev SSO ticket to arcturus_dev.users.auth_ticket.
 * NEVER touches arcturus_main.
 */
export async function writeArcturusDevTicket(arcturusDevId: number, ticket: string): Promise<void> {
  await arcturusDevDb.$executeRawUnsafe(
    'UPDATE users SET auth_ticket = ? WHERE id = ?',
    ticket,
    arcturusDevId,
  );
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function _initDevCurrencyRows(arcturusDevId: number, initialPixels: number): Promise<void> {
  await arcturusDevDb.$executeRawUnsafe(
    'INSERT IGNORE INTO users_currency (user_id, type, amount) VALUES (?, 0, ?)',
    arcturusDevId,
    initialPixels,
  );
  await arcturusDevDb.$executeRawUnsafe(
    'INSERT IGNORE INTO users_currency (user_id, type, amount) VALUES (?, 5, 0)',
    arcturusDevId,
  );
}
