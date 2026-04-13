import { Elysia } from "elysia";
import { authPlugin, requireAuth } from "../../middlewares/auth";
import { CreateAdBody, CreateLibraryBody, AdEventBody } from "../schemas";
import * as svc from "../services";
import { ok } from "../../utils/response";

export const adsRoutes = new Elysia({ prefix: "/ads" })
  .use(authPlugin)

  // Create ad
  .post("/", ({ user, body, set }) => {
    const u = requireAuth(user, set);
    try {
      set.status = 201;
      return ok(svc.createAd(u.id, body as any), "Ad created (pending activation)");
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, { body: CreateAdBody })

  // My ads
  .get("/mine", ({ user, set }) => {
    const u = requireAuth(user, set);
    return ok(svc.getMyAds(u.id));
  })

  // Get ad by id
  .get("/:id", ({ params, set }) => {
    try {
      return ok(svc.getAd(params.id));
    } catch (e: any) {
      set.status = 404;
      return { success: false, message: e.message };
    }
  })

  // Active ads (public, optional query filter)
  .get("/active", ({ query }) => {
    const ads = svc.getActiveAds(query.type as string, query.category as string);
    return ok(ads);
  })

  // Delete ad
  .delete("/:id", ({ user, params, set }) => {
    const u = requireAuth(user, set);
    svc.deleteAd(params.id, u.id);
    return ok(null, "Ad deleted");
  })

  // Stats
  .get("/:id/stats", ({ user, params, set }) => {
    const u = requireAuth(user, set);
    try {
      return ok(svc.getAdStats(params.id, u.id));
    } catch (e: any) {
      set.status = 403;
      return { success: false, message: e.message };
    }
  })

  // Track event (view / click)
  .post("/event", ({ body, request }) => {
    const b = body as any;
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ua = request.headers.get("user-agent") ?? "";
    svc.recordEvent(b.adId, b.event, b.libraryId, ip, ua);
    return ok(null, `${b.event} recorded`);
  }, { body: AdEventBody });

export const libraryRoutes = new Elysia({ prefix: "/library" })
  .use(authPlugin)

  // Create library
  .post("/", ({ user, body, set }) => {
    const u = requireAuth(user, set);
    set.status = 201;
    return ok(svc.createLibrary(u.id, body as any), "Library created");
  }, { body: CreateLibraryBody })

  // Get library + matching ads
  .get("/:id/ads", ({ params, set }) => {
    try {
      const ads = svc.getAdsByLibrary(params.id);
      return ok(ads);
    } catch (e: any) {
      set.status = 404;
      return { success: false, message: e.message };
    }
  })

  // Get library info
  .get("/:id", ({ params, set }) => {
    try {
      return ok(svc.getLibrary(params.id));
    } catch (e: any) {
      set.status = 404;
      return { success: false, message: e.message };
    }
  });
