import { Elysia } from "elysia";
import { createLogger } from "../utils/logger";

const log = createLogger("error-handler");

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(({ code, error, set, request }) => {
    const msg = error instanceof Error ? error.message : String(error);
    const path = new URL(request.url).pathname;

    switch (code) {
      case "VALIDATION":
        set.status = 422;
        log.warn(`Validation error on ${path}`, msg);
        return { success: false, message: "Validation error", details: msg, code: 422 };

      case "NOT_FOUND":
        set.status = 404;
        return { success: false, message: "Route not found", code: 404 };

      case "PARSE":
        set.status = 400;
        return { success: false, message: "Invalid JSON body", code: 400 };

      default:
        set.status = set.status && set.status >= 400 ? set.status : 500;
        log.error(`[${code}] ${path} — ${msg}`);
        return {
          success: false,
          message: msg || "Internal server error",
          code: set.status,
        };
    }
  });
