import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────
export const users = sqliteTable("users", {
  id:           text("id").primaryKey(),
  email:        text("email").notNull().unique(),
  password:     text("password").notNull(),      // bcrypt hash
  name:         text("name").notNull(),
  balance:      real("balance").notNull().default(0),
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
  updatedAt:    text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Companies ───────────────────────────────────────────
export const companies = sqliteTable("companies", {
  id:           text("id").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id),
  name:         text("name").notNull(),
  website:      text("website"),
  industry:     text("industry"),
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
});

// ─── Ads ─────────────────────────────────────────────────
export const ads = sqliteTable("ads", {
  id:           text("id").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id),
  companyId:    text("company_id").references(() => companies.id),
  title:        text("title").notNull(),
  description:  text("description").notNull(),
  bannerUrl:    text("banner_url"),
  type:         text("type").notNull(),           // banner | video | native | text
  category:     text("category").notNull(),        // tech | food | fashion | ...
  status:       text("status").notNull().default("inactive"), // active | inactive
  views:        integer("views").notNull().default(0),
  clicks:       integer("clicks").notNull().default(0),
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
  updatedAt:    text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Libraries ───────────────────────────────────────────
export const libraries = sqliteTable("libraries", {
  id:           text("id").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id),
  name:         text("name").notNull(),
  type:         text("type").notNull(),           // matches ads.type
  category:     text("category").notNull(),        // matches ads.category
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
});

// ─── Payment Transactions ─────────────────────────────────
export const transactions = sqliteTable("transactions", {
  id:           text("id").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id),
  amount:       real("amount").notNull(),
  currency:     text("currency").notNull().default("usd"),
  provider:     text("provider").notNull().default("mock"), // mock | stripe
  status:       text("status").notNull().default("pending"),// pending | success | failed
  stripePaymentId: text("stripe_payment_id"),
  note:         text("note"),
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
});

// ─── Ad Events (view/click log) ───────────────────────────
export const adEvents = sqliteTable("ad_events", {
  id:           text("id").primaryKey(),
  adId:         text("ad_id").notNull().references(() => ads.id),
  libraryId:    text("library_id").references(() => libraries.id),
  event:        text("event").notNull(),           // view | click
  ip:           text("ip"),
  userAgent:    text("user_agent"),
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
});

// ─── Engine Logs ─────────────────────────────────────────
export const engineLogs = sqliteTable("engine_logs", {
  id:           text("id").primaryKey(),
  action:       text("action").notNull(),
  userId:       text("user_id"),
  details:      text("details"),
  createdAt:    text("created_at").default(sql`(datetime('now'))`),
});
