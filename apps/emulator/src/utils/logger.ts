const RESET = '\x1b[0m';
const COLORS = {
  info:  '\x1b[36m',  // cyan
  warn:  '\x1b[33m',  // yellow
  error: '\x1b[31m',  // red
  debug: '\x1b[90m',  // gray
} as const;

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 23);
}

function log(level: keyof typeof COLORS, ...args: unknown[]): void {
  const color = COLORS[level];
  const prefix = `${color}[${level.toUpperCase()}]${RESET} \x1b[2m${timestamp()}${RESET}`;
  console.log(prefix, ...args);
}

export const logger = {
  info:  (...args: unknown[]) => log('info',  ...args),
  warn:  (...args: unknown[]) => log('warn',  ...args),
  error: (...args: unknown[]) => log('error', ...args),
  debug: (...args: unknown[]) => log('debug', ...args),
};
