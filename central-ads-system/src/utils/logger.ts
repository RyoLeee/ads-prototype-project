const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const current: Level = (process.env.LOG_LEVEL as Level) ?? "info";

const colors = {
  debug:   "\x1b[36m",   // cyan
  info:    "\x1b[32m",   // green
  warn:    "\x1b[33m",   // yellow
  error:   "\x1b[31m",   // red
  reset:   "\x1b[0m",
  dim:     "\x1b[2m",
  bold:    "\x1b[1m",
};

function format(level: Level, service: string, msg: string, data?: unknown) {
  const ts   = new Date().toISOString();
  const col  = colors[level];
  const lvl  = level.toUpperCase().padEnd(5);
  const svc  = `[${service}]`.padEnd(16);
  const extra = data ? `\n  ${JSON.stringify(data, null, 2)}` : "";
  return `${colors.dim}${ts}${colors.reset} ${col}${lvl}${colors.reset} ${colors.bold}${svc}${colors.reset} ${msg}${extra}`;
}

export function createLogger(service: string) {
  return {
    debug: (msg: string, data?: unknown) => {
      if (LEVELS[current] <= LEVELS.debug)
        console.log(format("debug", service, msg, data));
    },
    info: (msg: string, data?: unknown) => {
      if (LEVELS[current] <= LEVELS.info)
        console.log(format("info", service, msg, data));
    },
    warn: (msg: string, data?: unknown) => {
      if (LEVELS[current] <= LEVELS.warn)
        console.warn(format("warn", service, msg, data));
    },
    error: (msg: string, data?: unknown) => {
      if (LEVELS[current] <= LEVELS.error)
        console.error(format("error", service, msg, data));
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
