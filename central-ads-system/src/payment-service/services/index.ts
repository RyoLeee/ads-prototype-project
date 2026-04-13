import { db } from "../../db";
import { users, transactions } from "../../db/schema";
import { eq } from "drizzle-orm";
import { uid } from "../../utils/id";
import { createLogger } from "../../utils/logger";

const log = createLogger("payment-svc");
const MOCK_MODE = process.env.STRIPE_MOCK_MODE !== "false";

// ─── Mock payment processor ───────────────────────────────
async function mockCharge(amount: number, currency: string): Promise<string> {
  // Simulate network delay
  await Bun.sleep(120);
  return `mock_pi_${uid().slice(0, 16)}`;
}

// ─── Stripe processor (only if STRIPE_MOCK_MODE=false) ────
async function stripeCharge(amount: number, currency: string): Promise<string> {
  // Lazy import — only loads if stripe is installed
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency,
    payment_method: "pm_card_visa",   // test card
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });
  return paymentIntent.id;
}

// ─── Core topup ───────────────────────────────────────────
export async function topup(userId: string, amount: number, currency = "usd", note?: string) {
  // Verify user exists
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found");

  const txId = uid();
  const provider = MOCK_MODE ? "mock" : "stripe";

  // Insert pending tx
  db.insert(transactions).values({
    id: txId, userId, amount, currency, provider, status: "pending", note
  }).run();

  try {
    const paymentId = MOCK_MODE
      ? await mockCharge(amount, currency)
      : await stripeCharge(amount, currency);

    // Mark success + update balance
    db.update(transactions)
      .set({ status: "success", stripePaymentId: paymentId })
      .where(eq(transactions.id, txId))
      .run();

    const newBalance = user.balance + amount;
    db.update(users)
      .set({ balance: newBalance, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .run();

    log.info(`💳  Topup SUCCESS — user=${userId} amount=$${amount} balance=$${newBalance.toFixed(2)} txId=${txId}`);

    return {
      transactionId: txId,
      paymentId,
      amount,
      currency,
      provider,
      newBalance,
    };

  } catch (err: any) {
    db.update(transactions)
      .set({ status: "failed", note: err.message })
      .where(eq(transactions.id, txId))
      .run();

    log.error(`💳  Topup FAILED — user=${userId} amount=$${amount}`, err.message);
    throw new Error(`Payment failed: ${err.message}`);
  }
}

export function getBalance(userId: string) {
  const user = db.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found");
  return user.balance;
}

export function getTransactions(userId: string) {
  return db.select().from(transactions).where(eq(transactions.userId, userId)).all();
}
