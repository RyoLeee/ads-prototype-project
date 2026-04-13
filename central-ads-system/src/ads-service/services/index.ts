import { db } from "../../db";
import { ads, libraries, adEvents } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { uid } from "../../utils/id";
import { createLogger } from "../../utils/logger";

const log = createLogger("ads-svc");

// ─── Ads ──────────────────────────────────────────────────
export function createAd(userId: string, data: {
  title: string; description: string; bannerUrl?: string;
  type: string; category: string; companyId?: string;
}) {
  const id = uid();
  // Ads start inactive — payment-service / engine activates them
  db.insert(ads).values({ id, userId, ...data, status: "inactive" }).run();
  log.info(`Ad created (inactive): "${data.title}" for user ${userId}`);
  return getAd(id);
}

export function getAd(id: string) {
  const ad = db.select().from(ads).where(eq(ads.id, id)).get();
  if (!ad) throw new Error("Ad not found");
  return ad;
}

export function getMyAds(userId: string) {
  return db.select().from(ads).where(eq(ads.userId, userId)).all();
}

export function getActiveAds(type?: string, category?: string) {
  let query = db.select().from(ads).where(eq(ads.status, "active"));
  return query.all().filter(ad =>
    (!type || ad.type === type) && (!category || ad.category === category)
  );
}

export function updateAdStatus(adId: string, status: "active" | "inactive") {
  db.update(ads)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(ads.id, adId))
    .run();
}

export function bulkUpdateStatusByUser(userId: string, status: "active" | "inactive") {
  const result = db.update(ads)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(ads.userId, userId))
    .run();
  log.info(`Bulk ${status} for user ${userId} — rows affected: ${result.changes}`);
  return result.changes;
}

export function deleteAd(id: string, userId: string) {
  db.delete(ads).where(and(eq(ads.id, id), eq(ads.userId, userId))).run();
}

// ─── Libraries ────────────────────────────────────────────
export function createLibrary(userId: string, data: {
  name: string; type: string; category: string;
}) {
  const id = uid();
  db.insert(libraries).values({ id, userId, ...data }).run();
  log.info(`Library created: "${data.name}" type=${data.type} category=${data.category}`);
  return getLibrary(id);
}

export function getLibrary(id: string) {
  const lib = db.select().from(libraries).where(eq(libraries.id, id)).get();
  if (!lib) throw new Error("Library not found");
  return lib;
}

export function getAdsByLibrary(libraryId: string) {
  const lib = getLibrary(libraryId);
  return getActiveAds(lib.type, lib.category);
}

// ─── Events ───────────────────────────────────────────────
export function recordEvent(adId: string, event: "view" | "click", libraryId?: string, ip?: string, userAgent?: string) {
  const id = uid();
  db.insert(adEvents).values({ id, adId, event, libraryId, ip, userAgent }).run();

  if (event === "view") {
    db.update(ads).set({ views: db.select({ v: ads.views }).from(ads).where(eq(ads.id, adId)).get()!.v + 1 })
      .where(eq(ads.id, adId)).run();
  } else {
    db.update(ads).set({ clicks: db.select({ c: ads.clicks }).from(ads).where(eq(ads.id, adId)).get()!.c + 1 })
      .where(eq(ads.id, adId)).run();
  }
}

export function getAdStats(adId: string, userId: string) {
  const ad = getAd(adId);
  if (ad.userId !== userId) throw new Error("Forbidden");
  return { adId, views: ad.views, clicks: ad.clicks, ctr: ad.views > 0 ? (ad.clicks / ad.views * 100).toFixed(2) + "%" : "0%" };
}
