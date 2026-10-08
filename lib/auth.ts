import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, client } from "./db";
import { authSecret, siteUrl } from "./config";
import { HttpError } from "./errors";
import { apiKeyActor } from "./api-keys";
export { HttpError } from "./errors";
let instance: Awaited<ReturnType<typeof createAuth>> | undefined;
async function createAuth() {
  return betterAuth({
    appName: "Dhaka Bus Routes",
    baseURL: siteUrl(),
    secret: authSecret(),
    database: mongodbAdapter(await db(), { client: await client() }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 14,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "editor", input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 30,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: { "/sign-in/email": { window: 300, max: 5 } },
    },
    trustedOrigins: [siteUrl()],
    advanced: {
      useSecureCookies: siteUrl().startsWith("https:"),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
  });
}
export async function auth() {
  if (!instance) instance = await createAuth();
  return instance;
}
export type Actor = {
  id: string;
  name: string;
  role: "admin" | "editor";
  authType?: "session" | "api-key";
};
export async function actor(h: Headers, allowApiKey = true): Promise<Actor> {
  if (allowApiKey) {
    const key = await apiKeyActor(h);
    if (key) return key;
  }
  const s = await (await auth()).api.getSession({ headers: h });
  if (!s) throw new HttpError(401, "Sign in required.");
  const role = (s.user as typeof s.user & { role?: string }).role;
  if (role !== "admin" && role !== "editor")
    throw new HttpError(403, "Editorial access required.");
  return { id: s.user.id, name: s.user.name, role, authType: "session" };
}
export function administrator(a: Actor) {
  if (a.role !== "admin")
    throw new HttpError(403, "Administrator permission required.");
}
export async function pageActor(admin = false) {
  let a;
  try {
    a = await actor(await headers(), false);
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) redirect("/admin/login");
    throw e;
  }
  if (admin) administrator(a);
  return a;
}
export function sameOrigin(req: Request) {
  if (req.headers.get("origin") !== siteUrl())
    throw new HttpError(403, "Cross-site request rejected.");
}
export function mutationOrigin(req: Request, a: Actor) {
  // Only a successfully authenticated key can bypass session CSRF checks.
  if (a.authType !== "api-key") sameOrigin(req);
}
