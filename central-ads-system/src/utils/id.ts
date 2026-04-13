import { randomUUID } from "crypto";

export const uid = () => randomUUID();

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
