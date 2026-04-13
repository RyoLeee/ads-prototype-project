#!/usr/bin/env bun
/**
 * Starts all services in parallel with colored prefixed output.
 * Run: bun run dev:all
 */

const services = [
  { name: "company", color: "\x1b[34m", cmd: "src/company-service/main.ts" },
  { name: "ads    ", color: "\x1b[32m", cmd: "src/ads-service/main.ts" },
  { name: "payment", color: "\x1b[35m", cmd: "src/payment-service/main.ts" },
  { name: "engine ", color: "\x1b[33m", cmd: "src/main-engine/main.ts" },
  { name: "gateway", color: "\x1b[36m", cmd: "src/gateway/main.ts" },
];

const reset = "\x1b[0m";
const bold  = "\x1b[1m";

console.log(`${bold}🚀 Starting Central Ads System (all services)...${reset}\n`);

const procs = services.map(({ name, color, cmd }) => {
  const proc = Bun.spawn(["bun", "run", cmd], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });

  const prefix = `${color}[${name}]${reset} `;

  // Pipe stdout
  (async () => {
    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (line.trim()) process.stdout.write(prefix + line + "\n");
      }
    }
  })();

  // Pipe stderr
  (async () => {
    const reader = proc.stderr.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (line.trim()) process.stderr.write(prefix + line + "\n");
      }
    }
  })();

  return proc;
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n🛑  Shutting down all services...");
  for (const proc of procs) proc.kill();
  process.exit(0);
});

// Keep alive
await Promise.all(procs.map(p => p.exited));
