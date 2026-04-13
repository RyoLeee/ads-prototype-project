#!/usr/bin/env bun
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { errorHandler } from "../middlewares/errorHandler";
import { paymentRoutes } from "./routes";
import { createLogger } from "../utils/logger";

const log = createLogger("payment-svc");
const PORT = Number(process.env.PAYMENT_SERVICE_PORT ?? 3003);
const MODE = process.env.STRIPE_MOCK_MODE !== "false" ? "MOCK" : "STRIPE";

const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .get("/health", () => ({ status: "ok", service: "payment-service", port: PORT, mode: MODE }))
  .use(paymentRoutes)
  .listen(PORT);

log.info(`💳  Payment Service running on http://localhost:${PORT} [${MODE} mode]`);
log.info("    Routes: POST /payment/topup, GET /payment/balance, GET /payment/transactions");
