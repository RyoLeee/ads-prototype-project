#!/usr/bin/env bun
/**
 * CLI Payment Topup
 * Usage: bun run payment:topup --userId=<id> --amount=<usd>
 *
 * Examples:
 *   bun run payment:topup --userId=abc-123 --amount=5
 *   bun run payment:topup --userId=abc-123 --amount=0.5
 */
import { db } from "../db";
import { users, transactions } from "../db/schema";
import { eq } from "drizzle-orm";
import { uid } from "../utils/id";

// ─── Parse args ───────────────────────────────────────────
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, val] = arg.replace(/^--/, "").split("=");
  acc[key] = val;
  return acc;
}, {} as Record<string, string>);

const userId = args["userId"];
const amount = parseFloat(args["amount"]);

if (!userId || isNaN(amount) || amount <= 0) {
  console.error("❌  Usage: bun run payment:topup --userId=<id> --amount=<usd>");
  console.error("    Example: bun run payment:topup --userId=abc-123 --amount=5");
  process.exit(1);
}

// ─── Process topup ────────────────────────────────────────
const user = db.select().from(users).where(eq(users.id, userId)).get();
if (!user) {
  console.error(`❌  User not found: ${userId}`);
  process.exit(1);
}

const prevBalance = user.balance;
const newBalance  = prevBalance + amount;
const txId        = uid();

// Simulate mock payment
console.log(`\n💳  Processing payment...`);
await Bun.sleep(300);

db.insert(transactions).values({
  id: txId,
  userId,
  amount,
  currency: "usd",
  provider: "mock-cli",
  status: "success",
  note: "CLI topup",
}).run();

db.update(users)
  .set({ balance: newBalance, updatedAt: new Date().toISOString() })
  .where(eq(users.id, userId))
  .run();

console.log(`\n✅  Topup Successful!`);
console.log(`   User    : ${user.email} (${user.name})`);
console.log(`   Amount  : +$${amount.toFixed(2)} USD`);
console.log(`   Balance : $${prevBalance.toFixed(2)} → $${newBalance.toFixed(2)}`);
console.log(`   Tx ID   : ${txId}`);

if (prevBalance < 1 && newBalance >= 1) {
  console.log(`\n🟢  Balance now >= $1 — ads will be activated on next engine cycle!`);
} else if (newBalance >= 1) {
  console.log(`\n🟢  Balance is sufficient — ads remain active.`);
}
