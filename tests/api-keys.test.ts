import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { ObjectId, type MongoClient } from "mongodb";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  apiKeyActor,
} from "../lib/api-keys";
import { actor, mutationOrigin, type Actor } from "../lib/auth";
import { db, client } from "../lib/db";
const enabled = !!process.env.TEST_MONGODB_URI;
describe.skipIf(!enabled)("isolated API key authorization", () => {
  let connection: MongoClient, databaseName: string, admin: Actor;
  beforeAll(async () => {
    const uri = process.env.TEST_MONGODB_URI!;
    if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):/.test(uri))
      throw new Error("Tests require local MongoDB");
    databaseName = `dhaka_test_keys_${crypto.randomUUID().replaceAll("-", "")}`;
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB = databaseName;
    process.env.AUTH_SECRET = "isolated-test-secret-not-for-production-12345";
    process.env.SITE_URL = "http://localhost:3018";
    connection = await client();
    const id = new ObjectId();
    admin = {
      id: id.toHexString(),
      name: "Key owner",
      role: "admin",
      authType: "session",
    };
    await (
      await db()
    )
      .collection("user")
      .insertOne({ _id: id, name: admin.name, role: "admin" });
  });
  afterAll(async () => {
    if (connection && databaseName.startsWith("dhaka_test_keys_")) {
      await connection.db(databaseName).dropDatabase();
      await connection.close();
    }
  });
  it("stores a hash, reveals the token only at creation and authenticates without a cookie", async () => {
    const r = await createApiKey(admin, {
      name: "Publishing",
      expiresInDays: 90,
    });
    const stored = await (
      await db()
    )
      .collection("adminApiKeys")
      .findOne({ _id: r.key._id });
    expect(stored?.tokenHash).not.toBe(r.token);
    expect(JSON.stringify(stored)).not.toContain(r.token);
    expect(JSON.stringify(await listApiKeys(admin))).not.toContain("tokenHash");
    expect(JSON.stringify(await listApiKeys(admin))).not.toContain(r.token);
    const h = new Headers({ authorization: `Bearer ${r.token}` });
    const a = await actor(h);
    expect(a).toMatchObject({
      id: admin.id,
      role: "admin",
      authType: "api-key",
    });
    expect(() =>
      mutationOrigin(new Request("http://localhost:3018/api/admin/posts"), a),
    ).not.toThrow();
    expect(
      (
        await (
          await db()
        )
          .collection("adminApiKeys")
          .findOne({ _id: r.key._id })
      )?.lastUsedAt,
    ).toBeInstanceOf(Date);
  });
  it("does not exempt cookie sessions or forged/malformed headers from CSRF", async () => {
    expect(() =>
      mutationOrigin(
        new Request("http://localhost:3018", {
          headers: { authorization: "Bearer fake" },
        }),
        admin,
      ),
    ).toThrow("Cross-site");
    for (const value of [
      "Bearer fake",
      "Basic x",
      "",
      "Bearer dbr_" + "a".repeat(24) + "_" + "b".repeat(43),
    ])
      await expect(
        actor(new Headers({ authorization: value })),
      ).rejects.toMatchObject({ status: 401 });
  });
  it("rejects a revoked key immediately", async () => {
    const r = await createApiKey(admin, { name: "Revoke me" });
    await revokeApiKey(admin, r.key._id.toHexString());
    await expect(
      apiKeyActor(new Headers({ authorization: `Bearer ${r.token}` })),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("rejects expired keys and rechecks the owner role and existence", async () => {
    const r = await createApiKey(admin, { name: "Expired" });
    await (
      await db()
    )
      .collection("adminApiKeys")
      .updateOne({ _id: r.key._id }, { $set: { expiresAt: new Date(0) } });
    await expect(
      apiKeyActor(new Headers({ authorization: `Bearer ${r.token}` })),
    ).rejects.toMatchObject({ status: 401 });
    const active = await createApiKey(admin, {
      name: "Owner role",
      expiresInDays: null,
    });
    await (
      await db()
    )
      .collection("user")
      .updateOne({ _id: new ObjectId(admin.id) }, { $set: { role: "editor" } });
    await expect(
      apiKeyActor(new Headers({ authorization: `Bearer ${active.token}` })),
    ).rejects.toMatchObject({ status: 403 });
    await (
      await db()
    )
      .collection("user")
      .deleteOne({ _id: new ObjectId(admin.id) });
    await expect(
      apiKeyActor(new Headers({ authorization: `Bearer ${active.token}` })),
    ).rejects.toMatchObject({ status: 403 });
    await (await db()).collection("user").insertOne({
      _id: new ObjectId(admin.id),
      name: admin.name,
      role: "admin",
    });
  });
  it("protects key management from editors and other key owners", async () => {
    const editor: Actor = { ...admin, role: "editor" };
    await expect(createApiKey(editor, { name: "No" })).rejects.toMatchObject({
      status: 403,
    });
    await expect(listApiKeys(editor)).rejects.toMatchObject({ status: 403 });
    const r = await createApiKey(admin, { name: "Owner only" });
    const other = { ...admin, id: new ObjectId().toHexString() };
    expect(await listApiKeys(other)).toEqual([]);
    await expect(
      revokeApiKey(other, r.key._id.toHexString()),
    ).rejects.toMatchObject({ status: 404 });
  });
});
