import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./errors";
import type { Actor } from "./auth";

type ApiKey = {
  _id: ObjectId;
  userId: string;
  name: string;
  tokenHash: string;
  prefix: string;
  createdAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
};
export const apiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  expiresInDays: z
    .union([z.literal(30), z.literal(90), z.literal(365), z.null()])
    .default(90),
});
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
function requireAdmin(a: Actor) {
  if (a.role !== "admin")
    throw new HttpError(403, "Administrator permission required.");
}
export async function listApiKeys(a: Actor) {
  requireAdmin(a);
  return (await db())
    .collection<ApiKey>("adminApiKeys")
    .find({ userId: a.id }, { projection: { tokenHash: 0, userId: 0 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
}
export async function createApiKey(a: Actor, input: unknown) {
  requireAdmin(a);
  const value = apiKeySchema.parse(input);
  const now = new Date(),
    id = new ObjectId();
  const token = `dbr_${id.toHexString()}_${randomBytes(32).toString("base64url")}`;
  const key: ApiKey = {
    _id: id,
    userId: a.id,
    name: value.name,
    tokenHash: tokenHash(token),
    prefix: `dbr_${id.toHexString().slice(0, 8)}…${token.slice(-4)}`,
    createdAt: now,
    expiresAt:
      value.expiresInDays === null
        ? null
        : new Date(now.getTime() + value.expiresInDays * 86400000),
    revokedAt: null,
    lastUsedAt: null,
  };
  await (await db()).collection<ApiKey>("adminApiKeys").insertOne(key);
  // Never persist or return the raw token from subsequent reads.
  return {
    token,
    key: {
      _id: id,
      name: key.name,
      prefix: key.prefix,
      createdAt: now,
      expiresAt: key.expiresAt,
      revokedAt: null,
      lastUsedAt: null,
    },
  };
}
export async function revokeApiKey(a: Actor, id: string) {
  requireAdmin(a);
  if (!/^[a-f0-9]{24}$/.test(id)) throw new HttpError(400, "Invalid key ID.");
  const r = await (
    await db()
  )
    .collection<ApiKey>("adminApiKeys")
    .updateOne(
      { _id: new ObjectId(id), userId: a.id },
      { $set: { revokedAt: new Date() } },
    );
  if (!r.matchedCount) throw new HttpError(404, "API key not found.");
  return { ok: true };
}
export async function apiKeyActor(h: Headers): Promise<Actor | null> {
  const authorization = h.get("authorization");
  if (authorization === null) return null;
  const match = /^Bearer (dbr_([a-f0-9]{24})_[A-Za-z0-9_-]{43})$/i.exec(
    authorization,
  );
  if (!match) throw new HttpError(401, "Invalid API key.");
  const d = await db(),
    now = new Date();
  const keys = d.collection<ApiKey>("adminApiKeys");
  const key = await keys.findOne({
    _id: new ObjectId(match[2]),
    tokenHash: tokenHash(match[1]),
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });
  if (!key || !/^[a-f0-9]{24}$/.test(key.userId))
    throw new HttpError(401, "Invalid or expired API key.");
  const user = await d
    .collection("user")
    .findOne({ _id: new ObjectId(key.userId) });
  if (!user || user.role !== "admin")
    throw new HttpError(
      403,
      "API key owner no longer has administrator access.",
    );
  await keys.updateOne(
    { _id: key._id, revokedAt: null },
    { $set: { lastUsedAt: now } },
  );
  return {
    id: key.userId,
    name: String(user.name),
    role: "admin",
    authType: "api-key",
  };
}
