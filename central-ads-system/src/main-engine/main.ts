#!/usr/bin/env bun
/**
 * MAIN ENGINE — runs independently, polls DB every X seconds
 * Activates ads for users with balance >= 1 USD
 * Deactivates ads for users with balance < 1 USD
 *
 * Run: bun run dev:engine
 */
import { db } from "../db";
import { users, ads, engineLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "../utils/logger";
import { uid } from "../utils/id";

const log   = createLogger("ENGINE");
const INTERVAL_MS = Number(process.env.ENGINE_CHECK_INTERVAL ?? 10_000);
const MIN_BALANCE  = 1.0; // USD — threshold to keep ads active

function logAction(action: string, userId?: string, details?: string) {
  db.insert(engineLogs).values({ id: uid(), action, userId, details }).run();
}

async function runCycle() {
  const allUsers = db.select({
    id:      users.id,
    email:   users.email,
    balance: users.balance,
  }).from(users).all();

  if (allUsers.length === 0) {
    log.debug("No users found — skipping cycle");
    return;
  }

  let activated = 0;
  let deactivated = 0;

  for (const user of allUsers) {
    const userAds = db.select({
      id:     ads.id,
      status: ads.status,
    }).from(ads).where(eq(ads.userId, user.id)).all();

    if (userAds.length === 0) continue;

    if (user.balance >= MIN_BALANCE) {
      // Activate only the ones currently inactive
      const inactive = userAds.filter(a => a.status === "inactive");
      if (inactive.length > 0) {
        db.update(ads)
          .set({ status: "active", updatedAt: new Date().toISOString() })
          .where(eq(ads.userId, user.id))
          .run();

        log.info(`✅  User ${user.id} (${user.email}) — ${inactive.length} ad(s) ACTIVATED (balance: $${user.balance.toFixed(2)})`);
        logAction("activate_ads", user.id, `balance=$${user.balance.toFixed(2)} ads=${inactive.length}`);
        activated += inactive.length;
      }
    } else {
      // Deactivate only the ones currently active
      const active = userAds.filter(a => a.status === "active");
      if (active.length > 0) {
        db.update(ads)
          .set({ status: "inactive", updatedAt: new Date().toISOString() })
          .where(eq(ads.userId, user.id))
          .run();

        log.warn(`🔴  User ${user.id} (${user.email}) — ${active.length} ad(s) DEACTIVATED (balance: $${user.balance.toFixed(2)} < $${MIN_BALANCE})`);
        logAction("deactivate_ads", user.id, `balance=$${user.balance.toFixed(2)} ads=${active.length}`);
        deactivated += active.length;
      }
    }
  }

  if (activated > 0 || deactivated > 0) {
    log.info(`🔄  Cycle complete — activated: ${activated}  deactivated: ${deactivated}`);
  } else {
    log.debug(`🔄  Cycle complete — no changes (${allUsers.length} users checked)`);
  }
}

// ─── Start loop ───────────────────────────────────────────
log.info(`⚙️   Main Engine started — checking every ${INTERVAL_MS / 1000}s`);
log.info(`    Threshold: balance >= $${MIN_BALANCE} → ads active`);

// Run immediately on start, then on interval
runCycle().catch(err => log.error("Cycle error", err));

const timer = setInterval(() => {
  runCycle().catch(err => log.error("Cycle error", err));
}, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", () => {
  log.info("Engine shutting down...");
  clearInterval(timer);
  process.exit(0);
});
