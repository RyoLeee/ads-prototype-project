#!/usr/bin/env bun
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { errorHandler } from "../middlewares/errorHandler";
import { adsRoutes, libraryRoutes } from "./routes";
import { createLogger } from "../utils/logger";

const log = createLogger("ads-svc");
const PORT = Number(process.env.ADS_SERVICE_PORT ?? 3001);

const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .get("/health", () => ({ status: "ok", service: "ads-service", port: PORT }))
  .use(adsRoutes)
  .use(libraryRoutes)
  .listen(PORT);

log.info(`📢  Ads Service running on http://localhost:${PORT}`);
log.info("    Routes: /ads  /library");
