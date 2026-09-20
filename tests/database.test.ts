import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { ObjectId, MongoClient } from "mongodb";
import { blankDraft, type Draft } from "../lib/content";
const enabled = !!process.env.TEST_MONGODB_URI;
describe.skipIf(!enabled)("isolated MongoDB editorial lifecycle", () => {
  let connection: MongoClient;
  let databaseName: string;
  let cms: typeof import("../lib/cms");
  let admin: { id: string; name: string; role: "admin" };
  let draft: Draft;
  let postId: string;
  let termId: string;
  beforeAll(async () => {
    const uri = process.env.TEST_MONGODB_URI!;
    if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):/.test(uri))
      throw new Error("Tests require local MongoDB");
    databaseName = `dhaka_test_${crypto.randomUUID().replaceAll("-", "")}`;
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB = databaseName;
    process.env.AUTH_SECRET = "isolated-test-secret-not-for-production-12345";
    process.env.SITE_URL = "http://localhost:3000";
    cms = await import("../lib/cms");
    connection = await (await import("../lib/db")).client();
    await (await import("../lib/indexes")).setupIndexes();
    const d = connection.db(databaseName);
    admin = {
      id: new ObjectId().toHexString(),
      name: "Test author fixture",
      role: "admin",
    };
    await d.collection("authors").insertOne({
      userId: admin.id,
      name: admin.name,
      slug: "test-author",
      bio: "",
      locale: "en",
    });
    termId = new ObjectId().toHexString();
    await d.collection("categories").insertOne({
      _id: new ObjectId(termId),
      name: "Test category",
      slug: "test-category",
    });
    const mediaId = new ObjectId().toHexString();
    await d
      .collection("media")
      .insertOne({ _id: new ObjectId(mediaId), state: "ready" });
    draft = {
      ...blankDraft("original-slug"),
      title: "Published title",
      excerpt: "Published excerpt",
      seoDescription: "An honest description",
      categoryIds: [termId],
      primaryCategoryId: termId,
      featuredImage: { mediaId, alt: "Fixture image", caption: "" },
      content: {
        blocks: [{ type: "paragraph", data: { text: "Original public text" } }],
      },
    };
  });
  afterAll(async () => {
    if (connection && databaseName.startsWith("dhaka_test_")) {
      await connection.db(databaseName).dropDatabase();
      await connection.close();
    }
  });
  it("creates a draft hidden from public repository", async () => {
    const p = await cms.createPost(admin, draft);
    postId = String(p._id);
    expect((await cms.publicPosts()).total).toBe(0);
  });
  it("publishes an immutable snapshot and preserves dates", async () => {
    const p = await cms.mutatePost(admin, postId, 1, "publish");
    expect(p.published?.title).toBe("Published title");
    expect((await cms.publicPosts()).total).toBe(1);
  });
  it("autosave does not leak draft text and rejects concurrent writes", async () => {
    const p = await cms.mutatePost(admin, postId, 2, "save", {
      ...draft,
      title: "SECRET DRAFT TITLE",
    });
    expect(p.working.title).toBe("SECRET DRAFT TITLE");
    expect((await cms.publicPosts()).items[0].published?.title).toBe(
      "Published title",
    );
    await expect(
      cms.mutatePost(admin, postId, 2, "save", draft),
    ).rejects.toThrow("another tab");
  });
  it("prevents editor publication and referenced taxonomy deletion", async () => {
    await expect(
      cms.mutatePost({ ...admin, role: "editor" }, postId, 3, "publish"),
    ).rejects.toThrow("Administrator");
    await expect(cms.deleteTerm(admin, "categories", termId)).rejects.toThrow(
      "referenced",
    );
  });
  it("publishes slug changes as direct post-ID redirects", async () => {
    const before = await cms.getPost(postId);
    await cms.mutatePost(admin, postId, 3, "save", {
      ...draft,
      slug: "second-slug",
    });
    const p = await cms.mutatePost(admin, postId, 4, "publish");
    expect(p.firstPublishedAt).toEqual(before.firstPublishedAt);
    expect(
      await connection
        .db(databaseName)
        .collection("redirects")
        .findOne({ _id: "original-slug" as never }),
    ).toMatchObject({ postId });
    await cms.mutatePost(admin, postId, 5, "save", {
      ...draft,
      slug: "third-slug",
    });
    await cms.mutatePost(admin, postId, 6, "publish");
    expect(
      (
        await connection
          .db(databaseName)
          .collection("redirects")
          .find()
          .toArray()
      ).every((r) => r.postId === postId),
    ).toBe(true);
  });
  it("restores revisions only into the working draft", async () => {
    const rev = await connection
      .db(databaseName)
      .collection("revisions")
      .findOne({ postId, version: 1 });
    await cms.mutatePost(
      admin,
      postId,
      7,
      "restore",
      undefined,
      String(rev!._id),
    );
    const p = await cms.getPost(postId);
    expect(p.working.slug).toBe("original-slug");
    expect(p.published?.slug).toBe("third-slug");
  });
  it("unpublishes and archives without deleting history", async () => {
    await cms.mutatePost(admin, postId, 8, "unpublish");
    expect((await cms.publicPosts()).total).toBe(0);
    await cms.mutatePost(admin, postId, 9, "archive");
    expect((await cms.getPost(postId)).status).toBe("archived");
    expect(
      await connection
        .db(databaseName)
        .collection("revisions")
        .countDocuments({ postId }),
    ).toBeGreaterThan(5);
  });
  it("enforces unique working slugs at database level", async () => {
    await expect(cms.createPost(admin, draft)).rejects.toMatchObject({
      code: 11000,
    });
  });
});
