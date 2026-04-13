#!/usr/bin/env bun
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { errorHandler } from "../middlewares/errorHandler";
import { authRoutes, companyRoutes } from "./routes";
import { createLogger } from "../utils/logger";

const log = createLogger("company-svc");
const PORT = Number(process.env.COMPANY_SERVICE_PORT ?? 3002);

const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .get("/health", () => ({ status: "ok", service: "company-service", port: PORT }))
  .use(authRoutes)
  .use(companyRoutes)
  .listen(PORT);

log.info(`🏢  Company Service  →  http://localhost:${PORT}`);
