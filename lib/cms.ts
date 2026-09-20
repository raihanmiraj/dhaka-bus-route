import "server-only";
import { ObjectId, type ClientSession } from "mongodb";
import { db, client } from "./db";
import { type Actor, administrator, HttpError } from "./auth";
import {
  draftSchema,
  publicationIssues,
  mediaIds,
  idSchema,
  type Draft,
  type Snapshot,
  type Taxonomy,
} from "./content";
import { buses, stops, curatedJourneys } from "./routes";
export type Post = {
  _id: ObjectId;
  authorId: string;
  working: Draft;
  published?: Snapshot;
  status: "draft" | "published" | "archived";
  version: number;
  createdAt: Date;
  modifiedAt: Date;
  firstPublishedAt?: Date;
  publicModifiedAt?: Date;
};
export type Author = {
  _id: ObjectId;
  userId: string;
  name: string;
  slug: string;
  bio: string;
  locale: "en" | "bn";
};
export type Term = Taxonomy & {
  _id: ObjectId;
  modifiedAt: Date;
  guard?: number;
};
export const oid = (id: string) => new ObjectId(idSchema.parse(id));
export async function collections() {
  const d = await db();
  return {
    posts: d.collection<Post>("posts"),
    authors: d.collection<Author>("authors"),
    categories: d.collection<Term>("categories"),
    tags: d.collection<Term>("tags"),
  };
}
export async function getPost(id: string) {
  const p = await (await collections()).posts.findOne({ _id: oid(id) });
  if (!p) throw new HttpError(404, "Post not found.");
  return p;
}
export async function publicPosts(
  filter: Record<string, unknown> = {},
  page = 1,
  limit = 12,
) {
  const { posts } = await collections();
  const query = {
    ...filter,
    status: "published" as const,
    published: { $exists: true },
  };
  return {
    items: await posts
      .find(query, { projection: { published: 1 } })
      .sort({ "published.firstPublishedAt": -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    total: await posts.countDocuments(query),
  };
}
export async function references(
  d: Draft,
  session: ClientSession,
  publishing = false,
) {
  const c = await collections();
  for (const [kind, ids] of [
    ["categories", d.categoryIds],
    ["tags", d.tagIds],
  ] as const) {
    for (const id of ids) {
      const r = await c[kind].updateOne(
        { _id: oid(id) },
        { $inc: { guard: 1 } },
        { session },
      );
      if (!r.matchedCount)
        throw new HttpError(400, `Missing ${kind} reference.`);
    }
  }
  const database = await db();
  for (const id of mediaIds(d)) {
    const r = await database
      .collection("media")
      .updateOne(
        { _id: oid(id), state: "ready" },
        { $inc: { guard: 1 } },
        { session },
      );
    if (!r.matchedCount) throw new HttpError(400, "Missing image reference.");
    const media = await database
      .collection("media")
      .findOne({ _id: oid(id) }, { session });
    for (const block of d.content.blocks) {
      if (
        block.type === "image" &&
        block.data.file.mediaId === id &&
        (block.data.file.width !== media?.width ||
          block.data.file.height !== media?.height)
      )
        throw new HttpError(
          400,
          "Image dimensions do not match the stored image. Reinsert it from the media library.",
        );
    }
  }
  const paths = new Set([
    ...buses.map((b) => `/buses/${b.slug}`),
    ...stops.map((s) => `/stops/${s.id}`),
    ...curatedJourneys.map((j) => `/routes/${j.slug}`),
  ]);
  if (d.routeLinks.some((p) => !paths.has(p)))
    throw new HttpError(400, "A contextual route link no longer exists.");
  if (publishing) {
    const issues = publicationIssues(d);
    if (issues.length) throw new HttpError(400, issues.join(" "));
  }
}
export async function createPost(a: Actor, d: Draft) {
  const c = await collections();
  const now = new Date(),
    id = new ObjectId();
  await c.posts.insertOne({
    _id: id,
    authorId: a.id,
    working: draftSchema.parse(d),
    status: "draft",
    version: 1,
    createdAt: now,
    modifiedAt: now,
  });
  return getPost(id.toHexString());
}
export async function mutatePost(
  a: Actor,
  id: string,
  version: number,
  action: string,
  input?: unknown,
  revisionId?: string,
) {
  if (!Number.isInteger(version) || version < 1)
    throw new HttpError(400, "Version required");
  if (["publish", "unpublish", "archive"].includes(action)) administrator(a);
  const session = (await client()).startSession();
  try {
    await session.withTransaction(async () => {
      const c = await collections(),
        database = await db();
      const p = await c.posts.findOne({ _id: oid(id) }, { session });
      if (!p) throw new HttpError(404, "Post not found");
      if (p.version !== version)
        throw new HttpError(
          409,
          "This post changed in another tab. Reload before saving; your local text has been kept.",
        );
      const now = new Date();
      let working = p.working;
      const update: Partial<Post> = { modifiedAt: now, version: version + 1 };
      if (action === "save") {
        working = draftSchema.parse(input);
        await references(working, session);
        update.working = working;
      } else if (action === "restore") {
        const r = await database
          .collection("revisions")
          .findOne({ _id: oid(revisionId ?? ""), postId: id }, { session });
        if (!r) throw new HttpError(404, "Revision not found");
        working = draftSchema.parse(r.content);
        await references(working, session);
        update.working = working;
      } else if (action === "publish") {
        await references(working, session, true);
        const author = await c.authors.findOne(
          { userId: p.authorId },
          { session },
        );
        if (!author)
          throw new HttpError(
            400,
            "Create the real author profile before publication.",
          );
        if (
          working.translationGroup &&
          (await c.posts.findOne(
            {
              _id: { $ne: p._id },
              status: "published",
              "published.translationGroup": working.translationGroup,
              "published.locale": working.locale,
            },
            { session },
          ))
        )
          throw new HttpError(
            409,
            "A published translation already exists for this language in the group.",
          );
        const slug = working.slug;
        const claim = await database
          .collection("slugs")
          .findOne({ _id: slug as never }, { session });
        if (claim && claim.postId !== id)
          throw new HttpError(409, "Slug is reserved by another post.");
        await database
          .collection("slugs")
          .updateOne(
            { _id: slug as never },
            { $set: { postId: id } },
            { upsert: true, session },
          );
        const first = p.firstPublishedAt ?? now;
        update.published = {
          ...working,
          authorId: p.authorId,
          authorName: author.name,
          authorSlug: author.slug,
          firstPublishedAt: first,
          publicModifiedAt: now,
        };
        update.firstPublishedAt = first;
        update.publicModifiedAt = now;
        update.status = "published";
        if (p.published?.slug && p.published.slug !== slug)
          await database
            .collection("redirects")
            .updateOne(
              { _id: p.published.slug as never },
              { $set: { postId: id, createdAt: now } },
              { upsert: true, session },
            );
        await database
          .collection("redirects")
          .deleteOne({ _id: slug as never }, { session });
      } else if (action === "unpublish" || action === "archive") {
        update.status = action === "archive" ? "archived" : "draft";
        update.publicModifiedAt = now;
      } else throw new HttpError(400, "Unknown action");
      await database.collection("revisions").insertOne(
        {
          postId: id,
          version: p.version,
          content: p.working,
          published: p.published ?? null,
          action,
          actorId: a.id,
          createdAt: now,
        },
        { session },
      );
      const result = await c.posts.updateOne(
        { _id: p._id, version },
        { $set: update },
        { session },
      );
      if (!result.matchedCount)
        throw new HttpError(409, "Concurrent edit detected.");
    });
  } finally {
    await session.endSession();
  }
  return getPost(id);
}
export async function deleteTerm(
  a: Actor,
  kind: "categories" | "tags",
  id: string,
) {
  administrator(a);
  const session = (await client()).startSession();
  try {
    await session.withTransaction(async () => {
      const c = await collections();
      const term = await c[kind].findOneAndUpdate(
        { _id: oid(id) },
        { $inc: { guard: 1 } },
        { session },
      );
      if (!term) throw new HttpError(404, "Term not found");
      const field = kind === "categories" ? "categoryIds" : "tagIds";
      const used = await c.posts.findOne(
        { $or: [{ [`working.${field}`]: id }, { [`published.${field}`]: id }] },
        { session },
      );
      if (used)
        throw new HttpError(
          409,
          "This term is referenced by a working or published snapshot. Reassign those posts and publish the changes first.",
        );
      await c[kind].deleteOne({ _id: oid(id) }, { session });
    });
  } finally {
    await session.endSession();
  }
}
export async function liveMedia(id: string) {
  return !!(await (
    await collections()
  ).posts.findOne(
    {
      status: "published",
      $or: [
        { "published.featuredImage.mediaId": id },
        { "published.socialImageId": id },
        { "published.content.blocks.data.file.mediaId": id },
      ],
    },
    { projection: { _id: 1 } },
  ));
}
