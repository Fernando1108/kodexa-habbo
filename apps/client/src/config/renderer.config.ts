export const SOCKET_URL      = import.meta.env.VITE_SOCKET_URL      ?? 'ws://localhost:2096';
export const BETA_SOCKET_URL = import.meta.env.VITE_BETA_SOCKET_URL ?? 'ws://localhost:2097';
export const ASSET_URL       = import.meta.env.VITE_ASSET_URL       ?? 'http://localhost:3000/assets';
export const IMAGER_URL      = import.meta.env.VITE_IMAGER_URL      ?? 'http://localhost:1338';
export const MAX_FPS = 60;

// ── WebSocket host whitelist ──────────────────────────────────────────────────
// Comma-separated list of allowed host:port values for the ?ws= query param.
// Prevents ?ws= from pointing to arbitrary external servers.
// Default covers local dev only. Production should set explicit domain:port values.
const ALLOWED_WS_HOSTS_RAW: string =
  import.meta.env.VITE_ALLOWED_WS_HOSTS ??
  'localhost:2096,localhost:2097,127.0.0.1:2096,127.0.0.1:2097';

function parseAllowedWsHosts(): Set<string> {
  return new Set(
    ALLOWED_WS_HOSTS_RAW.split(',')
      .map(h => h.trim())
      .filter(Boolean)
  );
}

// Evaluated once at module load — no runtime overhead per request
const ALLOWED_WS_HOSTS: Set<string> = parseAllowedWsHosts();

/**
 * Validate a WebSocket URL.
 * Only ws:// and wss:// protocols are accepted.
 * Rejects: http://, https://, javascript:, file:, data:, empty strings, invalid URLs.
 */
export function isValidWsUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
}

/**
 * Check whether the URL's host:port is in the configured whitelist.
 * Fails closed (returns false) if URL is unparseable.
 */
export function isAllowedWsHost(url: string): boolean {
  try {
    const { host } = new URL(url); // "localhost:2097"
    return ALLOWED_WS_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * Sanitize a raw ?ws= query param value.
 * Rejects on: invalid protocol, host not in whitelist.
 * Returns the URL if safe, undefined otherwise (caller falls back to env default).
 */
export function sanitizeWsUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;

  if (!isValidWsUrl(raw)) {
    // Do not log the full URL — may contain malicious payloads
    console.warn('[sanitizeWsUrl] Rejected ?ws= param: invalid protocol (must be ws:// or wss://)');
    return undefined;
  }

  if (!isAllowedWsHost(raw)) {
    console.warn('[sanitizeWsUrl] Rejected ?ws= param: host not in VITE_ALLOWED_WS_HOSTS whitelist');
    return undefined;
  }

  return raw;
}

/**
 * Resolve the WebSocket URL at startup.
 * Priority: validated+whitelisted ?ws= param → VITE_SOCKET_URL env → hardcoded fallback.
 * The ?ws= param is injected by HotelBetaClient's iframe src so the client
 * connects to the correct emulator without rebuilding the bundle.
 */
export function resolveWsUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const wsParam = params.get('ws');
  return sanitizeWsUrl(wsParam) ?? SOCKET_URL;
}
