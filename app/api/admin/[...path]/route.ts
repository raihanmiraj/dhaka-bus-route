import { NextResponse } from "next/server";
import { z } from "zod";
import { actor, administrator, mutationOrigin, HttpError } from "@/lib/auth";
import { failure, json } from "@/lib/http";
import {
  collections,
  getPost,
  createPost,
  mutatePost,
  deleteTerm,
  oid,
} from "@/lib/cms";
import { blankDraft, taxonomySchema } from "@/lib/content";
import { db } from "@/lib/db";
import { escapeRegex } from "@/lib/pagination";
import { invalidatePublic } from "@/lib/invalidate";
import { buses, stops, curatedJourneys } from "@/lib/routes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const a = await actor(req.headers);
    const [kind, id, action] = (await params).path;
    const c = await collections();
    const url = new URL(req.url);
    if (req.method === "GET") {
      let data: unknown;
      if (kind === "posts") {
        if (id) {
          data =
            action === "revisions"
              ? await (
                  await db()
                )
                  .collection("revisions")
                  .find(
                    { postId: oid(id).toHexString() },
                    { projection: { content: 0, published: 0 } },
                  )
                  .sort({ version: -1 })
                  .limit(50)
                  .toArray()
              : await getPost(id);
        } else {
          const page = z.coerce
            .number()
            .int()
            .min(1)
            .max(10000)
            .parse(url.searchParams.get("page") || 1);
          const q = z
            .string()
            .max(100)
            .parse(url.searchParams.get("q") ?? "");
          const status = url.searchParams.get("status"),
            category = url.searchParams.get("category");
          const filter = {
            ...(q
              ? { "working.title": { $regex: escapeRegex(q), $options: "i" } }
              : {}),
            ...(status && ["draft", "published", "archived"].includes(status)
              ? { status: status as "draft" }
              : {}),
            ...(category
              ? { "working.categoryIds": oid(category).toHexString() }
              : {}),
          };
          const items = await c.posts
            .find(filter, {
              projection: {
                "working.title": 1,
                "working.slug": 1,
                status: 1,
                version: 1,
                modifiedAt: 1,
              },
            })
            .sort({ modifiedAt: -1 })
            .skip((page - 1) * 20)
            .limit(20)
            .toArray();
          data = { items, total: await c.posts.countDocuments(filter) };
        }
      } else if (kind === "categories" || kind === "tags")
        data = await c[kind].find().sort({ name: 1 }).limit(500).toArray();
      else if (kind === "media") {
        const page = z.coerce
          .number()
          .int()
          .min(1)
          .max(10000)
          .parse(url.searchParams.get("page") || 1);
        const q = z
          .string()
          .max(100)
          .parse(url.searchParams.get("q") ?? "");
        const filter = {
          state: "ready",
          ...(q ? { alt: { $regex: escapeRegex(q), $options: "i" } } : {}),
        };
        const media = (await db()).collection("media");
        data = {
          items: await media
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * 24)
            .limit(24)
            .toArray(),
          total: await media.countDocuments(filter),
        };
      } else if (kind === "corrections") {
        administrator(a);
        data = await (
          await db()
        )
          .collection("corrections")
          .find()
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();
      } else if (kind === "settings") {
        administrator(a);
        data = { profile: await c.authors.findOne({ userId: a.id }) };
      } else if (kind === "links") {
        const q = (url.searchParams.get("q") ?? "").slice(0, 100).toLowerCase();
        data = [
          ...buses.map((b) => ({ label: b.bus, href: `/buses/${b.slug}` })),
          ...stops.map((s) => ({ label: s.name, href: `/stops/${s.id}` })),
          ...curatedJourneys.map((j) => ({
            label: j.slug,
            href: `/routes/${j.slug}`,
          })),
        ]
          .filter((x) => x.label.toLowerCase().includes(q))
          .slice(0, 30);
      } else throw new HttpError(404, "Not found");
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex",
        },
      });
    }
    mutationOrigin(req, a);
    const body = await json(req);
    let data: unknown;
    if (kind === "posts") {
      if (!id) {
        data = await createPost(
          a,
          blankDraft(`draft-${crypto.randomUUID().slice(0, 8)}`),
        );
      } else if (action === "duplicate") {
        const p = await getPost(id);
        data = await createPost(a, {
          ...p.working,
          slug: `${p.working.slug.slice(0, 90)}-copy-${crypto.randomUUID().slice(0, 8)}`,
        });
      } else
        data = await mutatePost(
          a,
          id,
          body.version,
          action ?? "save",
          body.working,
          body.revisionId,
        );
    } else if (kind === "categories" || kind === "tags") {
      if (req.method === "DELETE") {
        await deleteTerm(a, kind, id);
        data = { ok: true };
      } else {
        administrator(a);
        const term = taxonomySchema.parse(body);
        if (id) {
          const r = await c[kind].updateOne(
            { _id: oid(id) },
            { $set: { ...term, modifiedAt: new Date() } },
          );
          if (!r.matchedCount) throw new HttpError(404, "Term not found");
          data = { ok: true };
        } else
          data = await c[kind].insertOne({
            ...term,
            modifiedAt: new Date(),
          } as never);
      }
    } else if (kind === "media") {
      const value = z
        .object({ alt: z.string().max(500), caption: z.string().max(1000) })
        .parse(body);
      const result = await (
        await db()
      )
        .collection("media")
        .updateOne({ _id: oid(id), state: "ready" }, { $set: value });
      if (!result.matchedCount) throw new HttpError(404, "Image not found");
      data = { ok: true };
    } else if (kind === "corrections") {
      administrator(a);
      const status = z.enum(["reviewed", "dismissed"]).parse(body.status);
      const note = z
        .string()
        .max(2000)
        .parse(body.note ?? "");
      await (
        await db()
      )
        .collection("corrections")
        .updateOne(
          { _id: oid(id) },
          { $set: { status, note, reviewedBy: a.id, reviewedAt: new Date() } },
        );
      data = { ok: true };
    } else if (kind === "settings") {
      administrator(a);
      const profile = z
        .object({
          name: z.string().min(1).max(150),
          slug: z.string().regex(/^[a-z0-9-]+$/),
          bio: z.string().max(2000),
          locale: z.enum(["en", "bn"]),
        })
        .parse(body);
      const existing = await c.authors.findOne({ userId: a.id });
      if (
        existing &&
        existing.slug !== profile.slug &&
        (await c.posts.countDocuments({ "published.authorId": a.id }))
      )
        throw new HttpError(
          409,
          "Keep the existing author slug to preserve published byline links.",
        );
      await c.authors.updateOne(
        { userId: a.id },
        { $set: profile },
        { upsert: true },
      );
      data = { ok: true };
    } else throw new HttpError(404, "Not found");
    invalidatePublic();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
