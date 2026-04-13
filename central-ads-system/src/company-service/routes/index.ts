import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { authPlugin, requireAuth } from "../../middlewares/auth";
import { RegisterBody, LoginBody, CreateCompanyBody } from "../schemas";
import * as svc from "../services";
import { ok } from "../../utils/response";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET ?? "change-me" }))
  .post("/register", async ({ body, set }) => {
    const { email, password, name } = body as any;
    try {
      const user = await svc.register(email, password, name);
      set.status = 201;
      return ok(user, "User registered successfully");
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, { body: RegisterBody })

  .post("/login", async ({ body, jwt, set }) => {
    const { email, password } = body as any;
    try {
      const user = await svc.login(email, password);
      const token = await jwt.sign({ id: user.id, email: user.email, name: user.name });
      return ok({ token, user }, "Login successful");
    } catch (e: any) {
      set.status = 401;
      return { success: false, message: e.message };
    }
  }, { body: LoginBody });

export const companyRoutes = new Elysia({ prefix: "/company" })
  .use(authPlugin)
  .get("/me", ({ user, set }) => {
    const u = requireAuth(user, set);
    return ok(svc.getUser(u.id));
  })
  .post("/", ({ user, body, set }) => {
    const u = requireAuth(user, set);
    try {
      set.status = 201;
      return ok(svc.createCompany(u.id, body as any), "Company created");
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, { body: CreateCompanyBody })
  .get("/", ({ user, set }) => {
    const u = requireAuth(user, set);
    return ok(svc.getMyCompanies(u.id));
  });
