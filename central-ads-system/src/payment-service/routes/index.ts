import { Elysia } from "elysia";
import { authPlugin, requireAuth } from "../../middlewares/auth";
import { TopupBody } from "../schemas";
import * as svc from "../services";
import { ok } from "../../utils/response";

export const paymentRoutes = new Elysia({ prefix: "/payment" })
  .use(authPlugin)

  // Topup balance
  .post("/topup", async ({ user, body, set }) => {
    const u = requireAuth(user, set);
    try {
      const result = await svc.topup(u.id, (body as any).amount, (body as any).currency, (body as any).note);
      return ok(result, "Balance topped up successfully");
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, { body: TopupBody })

  // Get current balance
  .get("/balance", ({ user, set }) => {
    const u = requireAuth(user, set);
    try {
      const balance = svc.getBalance(u.id);
      return ok({ balance, formatted: `$${balance.toFixed(2)} USD` });
    } catch (e: any) {
      set.status = 404;
      return { success: false, message: e.message };
    }
  })

  // Transaction history
  .get("/transactions", ({ user, set }) => {
    const u = requireAuth(user, set);
    return ok(svc.getTransactions(u.id));
  });
