import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { buses, stops, curatedJourneys } from "@/lib/routes";
import { collections } from "@/lib/cms";
import { mediaIds, type Snapshot } from "@/lib/content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Entry = MetadataRoute.Sitemap[number];

const BRAND_IMAGES = [
  "/images/featured-image.png",
  "/images/dhaka-bus-route-logo-transparent-blue-header.png",
  "/images/dhaka-bus-route-logo-blue-bg-preview.png",
  "/images/dhaka-bus-route-icon-transparent-blue-header-512.png",
];

function abs(base: string, path: string) {
  return path.startsWith("http") ? path : base + path;
}

function entry(
  base: string,
  path: string,
  opts: Omit<Entry, "url"> & { images?: string[] } = {},
): Entry {
  const { images, ...rest } = opts;
  return {
    url: abs(base, path),
    ...rest,
    ...(images?.length
      ? { images: images.map((src) => abs(base, src)) }
      : {}),
  };
}

function postImages(published: Snapshot): string[] {
  return mediaIds(published).map((id) => `/media/${id}`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const result: MetadataRoute.Sitemap = [
    entry(base, "/", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      images: BRAND_IMAGES,
    }),
    entry(base, "/buses", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    entry(base, "/stops", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    entry(base, "/routes", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    entry(base, "/blog", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    }),
    entry(base, "/blog/dhaka-bus-travel-guide-2026", {
      changeFrequency: "monthly",
      priority: 0.7,
      images: ["/images/featured-image.png"],
    }),
    entry(base, "/about", {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      images: ["/images/me.jpg", ...BRAND_IMAGES.slice(0, 2)],
    }),
    entry(base, "/privacy", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    entry(base, "/terms", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    entry(base, "/data-sources", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    }),
  ];

  for (const b of buses) {
    result.push(
      entry(base, `/buses/${b.slug}`, {
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    );
  }

  for (const s of stops) {
    result.push(
      entry(base, `/stops/${s.id}`, {
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    );
  }

  for (const j of curatedJourneys) {
    result.push(
      entry(base, `/routes/${j.slug}`, {
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    );
  }

  const c = await collections();
  const posts = await c.posts
    .find(
      { status: "published", "published.indexable": true },
      { projection: { published: 1 } },
    )
    .toArray();

  for (const p of posts) {
    if (!p.published) continue;
    result.push(
      entry(base, `/blog/${p.published.slug}`, {
        lastModified: p.published.publicModifiedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        images: postImages(p.published),
      }),
    );
  }

  for (const kind of ["categories", "tags"] as const) {
    for (const t of await c[kind].find({ indexable: true }).toArray()) {
      const field = kind === "categories" ? "categoryIds" : "tagIds";
      if (
        t.description.trim().length >= 80 &&
        (await c.posts.countDocuments({
          status: "published",
          [`published.${field}`]: String(t._id),
        }))
      ) {
        result.push(
          entry(
            base,
            `/blog/${kind === "categories" ? "category" : "tag"}/${t.slug}`,
            {
              lastModified: t.modifiedAt,
              changeFrequency: "weekly",
              priority: 0.5,
            },
          ),
        );
      }
    }
  }

  for (const a of await c.authors.find().toArray()) {
    if (
      await c.posts.countDocuments({
        status: "published",
        "published.authorId": a.userId,
      })
    ) {
      result.push(
        entry(base, `/authors/${a.slug}`, {
          changeFrequency: "monthly",
          priority: 0.4,
        }),
      );
    }
  }

  return result;
}
