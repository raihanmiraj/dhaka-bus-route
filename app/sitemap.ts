import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { buses, stops, curatedJourneys } from "@/lib/routes";
import { collections } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const paths = [
    "",
    "/buses",
    "/stops",
    "/routes",
    "/blog",
    "/blog/dhaka-bus-travel-guide-2026",
    "/about",
    "/data-sources",
    ...buses.map((b) => `/buses/${b.slug}`),
    ...stops.map((s) => `/stops/${s.id}`),
    ...curatedJourneys.map((j) => `/routes/${j.slug}`),
  ];

  const c = await collections();
  const posts = await c.posts
    .find(
      { status: "published", "published.indexable": true },
      { projection: { published: 1 } },
    )
    .toArray();

  const result: MetadataRoute.Sitemap = paths.map((p) => ({ url: base + p }));

  for (const p of posts)
    if (p.published)
      result.push({
        url: base + `/blog/${p.published.slug}`,
        lastModified: p.published.publicModifiedAt,
      });

  for (const kind of ["categories", "tags"] as const) {
    for (const t of await c[kind].find({ indexable: true }).toArray()) {
      const field = kind === "categories" ? "categoryIds" : "tagIds";
      if (
        t.description.trim().length >= 80 &&
        (await c.posts.countDocuments({
          status: "published",
          [`published.${field}`]: String(t._id),
        }))
      )
        result.push({
          url:
            base +
            `/blog/${kind === "categories" ? "category" : "tag"}/${t.slug}`,
          lastModified: t.modifiedAt,
        });
    }
  }

  for (const a of await c.authors.find().toArray())
    if (
      await c.posts.countDocuments({
        status: "published",
        "published.authorId": a.userId,
      })
    )
      result.push({ url: base + `/authors/${a.slug}` });

  return result;
}
