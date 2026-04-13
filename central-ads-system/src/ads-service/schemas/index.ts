import { t } from "elysia";

export const CreateAdBody = t.Object({
  title:       t.String({ minLength: 1 }),
  description: t.String({ minLength: 1 }),
  bannerUrl:   t.Optional(t.String()),
  type:        t.Union([t.Literal("banner"), t.Literal("video"), t.Literal("native"), t.Literal("text")]),
  category:    t.String({ minLength: 1 }),
  companyId:   t.Optional(t.String()),
});

export const CreateLibraryBody = t.Object({
  name:     t.String({ minLength: 1 }),
  type:     t.Union([t.Literal("banner"), t.Literal("video"), t.Literal("native"), t.Literal("text")]),
  category: t.String({ minLength: 1 }),
});

export const AdEventBody = t.Object({
  adId:      t.String(),
  libraryId: t.Optional(t.String()),
  event:     t.Union([t.Literal("view"), t.Literal("click")]),
});
