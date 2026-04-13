import { db } from "../../db";
import { users, companies } from "../../db/schema";
import { eq } from "drizzle-orm";
import { uid } from "../../utils/id";
import { createLogger } from "../../utils/logger";

const log = createLogger("company-svc");

// ─── Auth ─────────────────────────────────────────────────
export async function register(email: string, password: string, name: string) {
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) throw new Error("Email already registered");

  const hashed = await Bun.password.hash(password);
  const id = uid();

  db.insert(users).values({ id, email, password: hashed, name }).run();
  log.info(`User registered: ${email}`);

  return { id, email, name };
}

export async function login(email: string, password: string) {
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) throw new Error("Invalid email or password");

  const valid = await Bun.password.verify(password, user.password);
  if (!valid) throw new Error("Invalid email or password");

  log.info(`User logged in: ${email}`);
  return { id: user.id, email: user.email, name: user.name };
}

export function getUser(id: string) {
  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    balance: users.balance,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, id)).get();

  if (!user) throw new Error("User not found");
  return user;
}

// ─── Company ──────────────────────────────────────────────
export function createCompany(userId: string, data: {
  name: string; website?: string; industry?: string;
}) {
  const id = uid();
  db.insert(companies).values({ id, userId, ...data }).run();
  log.info(`Company created: ${data.name} for user ${userId}`);
  return { id, userId, ...data };
}

export function getMyCompanies(userId: string) {
  return db.select().from(companies).where(eq(companies.userId, userId)).all();
}
