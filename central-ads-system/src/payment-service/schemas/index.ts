import { t } from "elysia";

export const TopupBody = t.Object({
  amount:   t.Number({ minimum: 0.5 }),
  currency: t.Optional(t.String()),
  note:     t.Optional(t.String()),
});
