import { t } from "elysia";

export const RegisterBody = t.Object({
  email:    t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
  name:     t.String({ minLength: 1 }),
});

export const LoginBody = t.Object({
  email:    t.String({ format: "email" }),
  password: t.String(),
});

export const CreateCompanyBody = t.Object({
  name:     t.String({ minLength: 1 }),
  website:  t.Optional(t.String()),
  industry: t.Optional(t.String()),
});
