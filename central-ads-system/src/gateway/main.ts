#!/usr/bin/env bun
/**
 * GATEWAY — single entry point for all services
 * Proxies: /auth, /company → company-service:3002
 *          /ads, /library  → ads-service:3001
 *          /payment        → payment-service:3003
 *
 * Run: bun run dev:gateway
 */
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { errorHandler } from "../middlewares/errorHandler";
import { createLogger } from "../utils/logger";

const log = createLogger("GATEWAY");
const PORT = Number(process.env.GATEWAY_PORT ?? 3000);

const ADS_URL     = process.env.ADS_SERVICE_URL     ?? "http://localhost:3001";
const COMPANY_URL = process.env.COMPANY_SERVICE_URL ?? "http://localhost:3002";
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL ?? "http://localhost:3003";

// ─── Generic proxy helper ─────────────────────────────────
async function proxy(targetBase: string, path: string, request: Request) {
  const url    = `${targetBase}${path}`;
  const method = request.method;
  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);
  const body    = hasBody ? await request.text() : undefined;

  log.debug(`→ ${method} ${url}`);

  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── App ──────────────────────────────────────────────────
const app = new Elysia()
  .use(cors())
  .use(errorHandler)

  // Health
  .get("/health", () => ({
    status: "ok",
    service: "gateway",
    port: PORT,
    upstreams: { ads: ADS_URL, company: COMPANY_URL, payment: PAYMENT_URL },
  }))

  // ── company-service routes ──
  .all("/auth/*",    ({ request }) => proxy(COMPANY_URL, new URL(request.url).pathname, request))
  .all("/company/*", ({ request }) => proxy(COMPANY_URL, new URL(request.url).pathname, request))
  .all("/company",   ({ request }) => proxy(COMPANY_URL, "/company", request))

  // ── ads-service routes ──
  .all("/ads/*",     ({ request }) => proxy(ADS_URL, new URL(request.url).pathname, request))
  .all("/ads",       ({ request }) => proxy(ADS_URL, "/ads", request))
  .all("/library/*", ({ request }) => proxy(ADS_URL, new URL(request.url).pathname, request))
  .all("/library",   ({ request }) => proxy(ADS_URL, "/library", request))

  // ── payment-service routes ──
  .all("/payment/*", ({ request }) => proxy(PAYMENT_URL, new URL(request.url).pathname, request))
  .all("/payment",   ({ request }) => proxy(PAYMENT_URL, "/payment", request))

  .listen(PORT);

log.info(`🚀  Gateway running on http://localhost:${PORT}`);
log.info(`    → /auth, /company  →  ${COMPANY_URL}`);
log.info(`    → /ads, /library   →  ${ADS_URL}`);
log.info(`    → /payment         →  ${PAYMENT_URL}`);
