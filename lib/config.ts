import "server-only";
import { z } from "zod";

/** Preferred public origin — HTTPS www (matches live production + task requirement). */
export const CANONICAL_ORIGIN = "https://www.dhakabusroutes.com";

export function siteUrl() {
  const raw = process.env.SITE_URL || CANONICAL_ORIGIN;
  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  )
    throw new Error("SITE_URL must be an origin");
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  )
    throw new Error("SITE_URL must use HTTPS");
  // Normalize apex → www so sitemap/canonicals stay on the preferred host.
  if (url.hostname === "dhakabusroutes.com")
    url.hostname = "www.dhakabusroutes.com";
  return url.origin;
}
export function databaseConfig() {
  const result = z
    .object({
      MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
      MONGODB_DB: z
        .string()
        .min(1)
        .regex(/^[a-zA-Z0-9_-]+$/),
    })
    .safeParse(process.env);
  if (!result.success)
    throw new Error(
      "Database setup required: configure MONGODB_URI and MONGODB_DB.",
    );
  return result.data;
}
export function authSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32 || s.startsWith("<"))
    throw new Error(
      "Authentication setup required: AUTH_SECRET must contain at least 32 random characters.",
    );
  return s;
}
