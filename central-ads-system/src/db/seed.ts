#!/usr/bin/env bun
/**
 * Run: bun run db:seed
 * Seeds demo user, company, ads, and library.
 */
import { db } from "./index";
import { users, companies, ads, libraries } from "./schema";
import { randomUUID } from "crypto";

const password = await Bun.password.hash("password123");

const userId    = randomUUID();
const companyId = randomUUID();
const adId1     = randomUUID();
const adId2     = randomUUID();
const libId     = randomUUID();

await db.insert(users).values({
  id: userId,
  email: "demo@ads.dev",
  password,
  name: "Demo User",
  balance: 5.00,
}).onConflictDoNothing();

await db.insert(companies).values({
  id: companyId,
  userId,
  name: "Demo Corp",
  website: "https://demo.dev",
  industry: "Technology",
}).onConflictDoNothing();

await db.insert(ads).values([
  {
    id: adId1,
    userId,
    companyId,
    title: "Buy Our SaaS Tool",
    description: "Best project management tool for devs",
    bannerUrl: "https://placehold.co/728x90?text=SaaS+Banner",
    type: "banner",
    category: "tech",
    status: "active",
  },
  {
    id: adId2,
    userId,
    companyId,
    title: "Learn TypeScript Fast",
    description: "Online course — zero to hero in 30 days",
    bannerUrl: "https://placehold.co/300x250?text=Course",
    type: "native",
    category: "education",
    status: "active",
  },
]).onConflictDoNothing();

await db.insert(libraries).values({
  id: libId,
  userId,
  name: "Tech Blog Sidebar",
  type: "banner",
  category: "tech",
}).onConflictDoNothing();

console.log("🌱  Seed complete!");
console.log(`   User  : demo@ads.dev  /  password123`);
console.log(`   UserId: ${userId}`);
console.log(`   LibId : ${libId}`);
