import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

export type JwtPayload = {
  id: string;
  email: string;
  name: string;
};

/**
 * Reusable auth plugin — attach to any Elysia app.
 * Guards routes via Bearer token in Authorization header.
 */
export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET ?? "change-me-in-production",
    })
  )
  .derive(async ({ jwt, headers, set }) => {
    const authorization = headers["authorization"];
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return { user: null };
    }
    const token = authorization.slice(7);
    const payload = await jwt.verify(token);
    if (!payload) return { user: null };
    return { user: payload as JwtPayload };
  });

/**
 * Guard — call inside route handler to enforce auth.
 */
export function requireAuth(user: JwtPayload | null, set: { status: number }) {
  if (!user) {
    set.status = 401;
    throw new Error("Unauthorized — provide a valid Bearer token");
  }
  return user;
}
