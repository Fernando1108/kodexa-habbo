import { arcturusDb } from './arcturus-db';

// ── Constants ──────────────────────────────────────────────────────────────
/**
 * Default home_room for new users.
 * 0 = no personal room set — Arcturus places user in hotel view (reception).
 * This is the correct default; users choose/create their own room later.
 */
export const ARCTURUS_DEFAULT_HOME_ROOM = 0;

/**
 * Default look for new users — valid Nitro figure string.
 * Matches the figure parts available in the bundled FigureData.json.
 */
export const ARCTURUS_DEFAULT_LOOK = 'hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92';

// ── Interfaces ─────────────────────────────────────────────────────────────
interface KodexaUser {
  id: number;
  username: string;
  email: string;
  rank: number;
  look: string;
  motto: string;
  credits: number;
  /** kodexa_hotel.users.pixels — used as initial duckets (users_currency type=0) */
  pixels: number;
}

interface ArcturusUserRow {
  id: number;
  username: string;
  home_room: number;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Syncs a kodexa_hotel user to arcturus_main.users.
 *
 * Match strategy: email (kodexa.email ↔ arcturus.mail)
 *
 * Existing user:
 *   - Updates: rank, look, motto (kodexa is source of truth)
 *   - Preserves: credits, home_room (if > 0), all inventory/room data
 *   - Initialises: users_currency rows if missing (INSERT IGNORE)
 *
 * New user:
 *   - Inserts with kodexa values as defaults
 *   - Creates users_currency rows for duckets (type 0) and diamonds (type 5)
 *
 * Returns the arcturus user id.
 */
export async function syncUserToArcturus(user: KodexaUser): Promise<number> {
  const existing = await arcturusDb.$queryRawUnsafe<ArcturusUserRow[]>(
    'SELECT id, username, home_room FROM users WHERE mail = ? LIMIT 1',
    user.email,
  );

  let arcturusId: number;

  if (existing.length > 0) {
    arcturusId = existing[0]!.id;

    // kodexa_hotel is source of truth for rank/look/motto
    await arcturusDb.$executeRawUnsafe(
      'UPDATE users SET `rank` = ?, `look` = ?, motto = ? WHERE id = ?',
      user.rank,
      user.look || ARCTURUS_DEFAULT_LOOK,
      user.motto || '',
      arcturusId,
    );

    // Initialise currency rows if missing — INSERT IGNORE is a no-op when row exists
    await _initCurrencyRows(arcturusId, user.pixels);
  } else {
    // New user — insert with safe Arcturus defaults
    await arcturusDb.$executeRawUnsafe(
      `INSERT INTO users
         (username, mail, password, \`rank\`, \`look\`, gender, motto,
          credits, home_room, account_created, last_online)
       VALUES
         (?, ?, ?, ?, ?, 'M', ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,
      user.username,
      user.email,
      // Opaque placeholder — SSO auth never uses password path
      `kx_sso_${user.id}`,
      user.rank,
      user.look || ARCTURUS_DEFAULT_LOOK,
      user.motto || '',
      user.credits,
      ARCTURUS_DEFAULT_HOME_ROOM,
    );

    const inserted = await arcturusDb.$queryRawUnsafe<ArcturusUserRow[]>(
      'SELECT id FROM users WHERE mail = ? LIMIT 1',
      user.email,
    );
    if (!inserted[0]) {
      throw new Error(`[arcturus-sync] INSERT failed for email: ${user.email}`);
    }
    arcturusId = inserted[0].id;

    // Create currency rows for new user
    await _initCurrencyRows(arcturusId, user.pixels);
  }

  return arcturusId;
}

/**
 * Writes the SSO ticket to arcturus_main.users.auth_ticket.
 * Must be called after syncUserToArcturus() so the user is guaranteed to exist.
 */
export async function writeArcturusTicket(arcturusId: number, ticket: string): Promise<void> {
  await arcturusDb.$executeRawUnsafe(
    'UPDATE users SET auth_ticket = ? WHERE id = ?',
    ticket,
    arcturusId,
  );
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Creates users_currency rows for duckets (type 0) and diamonds (type 5)
 * using INSERT IGNORE — safe to call on existing users (no-op if row exists).
 */
async function _initCurrencyRows(arcturusId: number, initialPixels: number): Promise<void> {
  // Duckets (type 0) — initial amount from kodexa pixels
  await arcturusDb.$executeRawUnsafe(
    'INSERT IGNORE INTO users_currency (user_id, type, amount) VALUES (?, 0, ?)',
    arcturusId,
    initialPixels,
  );
  // Diamonds (type 5) — start at 0
  await arcturusDb.$executeRawUnsafe(
    'INSERT IGNORE INTO users_currency (user_id, type, amount) VALUES (?, 5, 0)',
    arcturusId,
  );
}
