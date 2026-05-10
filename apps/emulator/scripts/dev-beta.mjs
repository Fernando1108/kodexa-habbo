#!/usr/bin/env node
/**
 * Cross-platform dev:beta launcher.
 * Equivalent to: BETA_MODE=true PORT=2097 tsx watch src/index.ts
 *
 * Use this on Windows cmd.exe where inline env var prefix doesn't work.
 * On bash/zsh: use `pnpm dev:beta` directly instead.
 *
 * Usage: node scripts/dev-beta.mjs
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');

const env = {
  ...process.env,
  BETA_MODE: 'true',
  PORT:      '2097',
};

// npx tsx works on both bash and Windows cmd (shell:true resolves npx correctly)
const child = spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
  env,
  stdio:  'inherit',
  cwd:    root,
  shell:  true,
});

child.on('exit',  (code)  => process.exit(code ?? 0));
child.on('error', (err)   => {
  console.error('[dev-beta] Failed to start emulator:', err.message);
  process.exit(1);
});
