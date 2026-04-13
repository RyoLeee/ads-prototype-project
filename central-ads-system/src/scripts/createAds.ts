/**
 * ADS ENGINE CLIENT — simulates publisher-side ad loading
 *
 * Usage:
 *   import { createAds } from "./src/scripts/createAds";
 *   await createAds({ libraryId: "your-library-id" });
 *
 * Or run directly:
 *   bun run src/scripts/createAds.ts --libraryId=xxx
 */

const ADS_URL = process.env.ADS_SERVICE_URL ?? "http://localhost:3001";

type Ad = {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  type: string;
  category: string;
  views: number;
  clicks: number;
};

// ─── ANSI colors ─────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
  green:  "\x1b[32m",
  dim:    "\x1b[2m",
  magenta:"\x1b[35m",
};

function renderAd(ad: Ad, index: number) {
  console.log(`\n${c.bold}${c.cyan}┌─ AD #${index + 1} ${"─".repeat(50)}${c.reset}`);
  console.log(`${c.cyan}│${c.reset} ${c.bold}${ad.title}${c.reset}`);
  console.log(`${c.cyan}│${c.reset} ${c.dim}${ad.description}${c.reset}`);
  if (ad.bannerUrl) console.log(`${c.cyan}│${c.reset} 🖼  ${c.yellow}${ad.bannerUrl}${c.reset}`);
  console.log(`${c.cyan}│${c.reset} Type: ${ad.type}  Category: ${ad.category}  Views: ${ad.views}  Clicks: ${ad.clicks}`);
  console.log(`${c.cyan}└${"─".repeat(56)}${c.reset}`);
}

async function recordEvent(adId: string, event: "view" | "click", libraryId?: string) {
  await fetch(`${ADS_URL}/ads/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adId, event, libraryId }),
  });
}

export async function createAds({ libraryId }: { libraryId: string }) {
  console.log(`\n${c.bold}${c.magenta}🚀 ADS ENGINE CLIENT${c.reset}`);
  console.log(`${c.dim}Library: ${libraryId}${c.reset}`);
  console.log(`${c.dim}Fetching ads from ${ADS_URL}...${c.reset}`);

  const res = await fetch(`${ADS_URL}/library/${libraryId}/ads`);
  if (!res.ok) {
    console.error(`❌  Failed to fetch ads: ${res.status}`);
    return;
  }

  const json = await res.json() as { success: boolean; data: Ad[] };
  const ads  = json.data ?? [];

  if (ads.length === 0) {
    console.log(`\n${c.yellow}⚠️  No active ads found for this library.${c.reset}`);
    console.log("   Make sure: (1) ads exist, (2) user balance >= $1, (3) engine has run.");
    return;
  }

  console.log(`\n${c.green}✅  Found ${ads.length} active ad(s):${c.reset}`);
  ads.forEach((ad, i) => renderAd(ad, i));

  // Send view events for all ads
  console.log(`\n${c.dim}📊 Sending view events...${c.reset}`);
  await Promise.all(ads.map(ad => recordEvent(ad.id, "view", libraryId)));
  console.log(`${c.green}✅  Views recorded for ${ads.length} ad(s)${c.reset}`);

  // Simulate click on first ad
  if (ads.length > 0) {
    const firstAd = ads[0];
    console.log(`\n${c.dim}🖱  Simulating click on: "${firstAd.title}"${c.reset}`);
    await recordEvent(firstAd.id, "click", libraryId);
    console.log(`${c.green}✅  Click recorded${c.reset}`);
  }

  return ads;
}

// ─── Direct CLI run ───────────────────────────────────────
if (import.meta.main) {
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    acc[k] = v;
    return acc;
  }, {} as Record<string, string>);

  const libraryId = args["libraryId"];
  if (!libraryId) {
    console.error("❌  Usage: bun run src/scripts/createAds.ts --libraryId=<id>");
    process.exit(1);
  }

  await createAds({ libraryId });
}
