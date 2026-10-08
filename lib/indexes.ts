import "server-only";
import { db } from "./db";
export async function setupIndexes() {
  const d = await db();
  await d
    .collection("posts")
    .createIndexes([
      { key: { "working.slug": 1 }, unique: true },
      { key: { status: 1, "published.slug": 1 } },
      { key: { status: 1, "published.firstPublishedAt": -1 } },
      { key: { status: 1, "published.categoryIds": 1 } },
      { key: { status: 1, "published.tagIds": 1 } },
      { key: { status: 1, "published.authorId": 1 } },
    ]);
  for (const kind of ["categories", "tags", "authors"])
    await d.collection(kind).createIndex({ slug: 1 }, { unique: true });
  await d.collection("authors").createIndex({ userId: 1 }, { unique: true });
  await d.collection("user").createIndex({ email: 1 }, { unique: true });
  await d.collection("session").createIndex({ token: 1 }, { unique: true });
  await d
    .collection("session")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await d
    .collection("account")
    .createIndex({ providerId: 1, accountId: 1 }, { unique: true });
  await d.collection("rateLimit").createIndex({ key: 1 }, { unique: true });
  await d
    .collection("abuse")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await d
    .collection("revisions")
    .createIndex({ postId: 1, version: -1 }, { unique: true });
  await d.collection("media").createIndex({ createdAt: -1 });
  await d.collection("corrections").createIndex({ status: 1, createdAt: -1 });
  await d.collection("adminApiKeys").createIndex({ userId: 1, createdAt: -1 });
}
