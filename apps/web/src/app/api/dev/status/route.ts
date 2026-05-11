import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessDevelopment } from '@/lib/guards';
import { prisma } from '@/lib/db';
import { isArcturusDevReady } from '@/lib/arcturus-dev-sync';
import net from 'net';

/**
 * Checks whether a TCP port is accepting connections.
 * Used to detect if Arcturus Dev WS (2097) is running.
 * Returns false on timeout (1000ms) or error — never throws.
 */
function checkTcpPort(host: string, port: number, timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const timer  = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.on('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on('error',   () => { clearTimeout(timer); resolve(false); });
  });
}

/**
 * GET /api/dev/status
 *
 * Returns the operational status of the dev environment.
 * Requires authenticated session with rank >= 9.
 *
 * Response includes:
 *   - arcturusDevBootstrapped: DB has users table
 *   - runtimeReady:  WS port 2097 accepting TCP connections
 *   - nitroDevUrlConfigured: NEXT_PUBLIC_NITRO_DEV_URL is set
 *   - devDbUrlConfigured: ARCTURUS_DEV_DB_URL is set
 *   - websocketUrl: "ws://localhost:2097" (static — from env or default)
 *   - ready: all checks pass
 *
 * URLs are never exposed as strings — only the WS url is included
 * to help the UI display it; the Nitro URL remains boolean-only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: parseInt(session.user.id) },
    select: { rank: true },
  });
  if (!user || !canAccessDevelopment(user.rank)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const nitroDevUrl = process.env.NEXT_PUBLIC_NITRO_DEV_URL ?? null;
  const devDbUrl    = process.env.ARCTURUS_DEV_DB_URL        ?? null;

  // ── DB check ──────────────────────────────────────────────────────────────
  const devReady = await isArcturusDevReady();

  // ── Runtime check: TCP probe on WS dev port ───────────────────────────────
  // Derived from NEXT_PUBLIC_DEV_HOTEL_WS_URL or hardcoded default.
  // The check is server-side only — result is a boolean, port not exposed.
  const wsUrl    = process.env.NEXT_PUBLIC_DEV_HOTEL_WS_URL ?? 'ws://localhost:2097';
  const wsPort   = (() => {
    try { return parseInt(new URL(wsUrl).port) || 2097; }
    catch { return 2097; }
  })();
  const runtimeReady = devReady ? await checkTcpPort('127.0.0.1', wsPort) : false;

  return NextResponse.json({
    ok: true,
    status: {
      arcturusDevBootstrapped: devReady,
      runtimeReady,
      nitroDevUrlConfigured:   !!nitroDevUrl,
      devDbUrlConfigured:      !!devDbUrl,
      websocketUrl:            wsUrl,          // show WS url for UI diagnostics
      ready: devReady && runtimeReady && !!nitroDevUrl && !!devDbUrl,
    },
  });
}
