import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeSlug } from "../lib/url";
import { buses, stops, slugify, curatedJourneys } from "../lib/routes";
import { generateMetadata as busMetadata } from "../app/buses/[slug]/page";
import { generateMetadata as stopMetadata } from "../app/stops/[slug]/page";
import { generateMetadata as journeyMetadata } from "../app/routes/[slug]/page";
import { metadata as pageMeta, paginatedMetadata, DEFAULT_OG_IMAGE } from "../lib/seo";
import { generateMetadata as authorMetadata } from "../app/authors/[slug]/page";
import { featuredGuide } from "../lib/featured-guide";
import { slugify as lightSlugify, normalize } from "../lib/slug";
import { CANONICAL_ORIGIN, siteUrl } from "../lib/config";

const { posts, categories, tags, authors } = vi.hoisted(() => ({
  posts: { find: vi.fn(), countDocuments: vi.fn() },
  categories: { find: vi.fn() },
  tags: { find: vi.fn() },
  authors: { find: vi.fn(), findOne: vi.fn() },
}));
vi.mock("@/lib/cms", () => ({
  collections: vi.fn(async () => ({ posts, categories, tags, authors })),
  publicPosts: vi.fn(async () => ({ items: [], total: 1 })),
}));
vi.mock("@/components/route-map", () => ({ RouteMap: vi.fn() }));
import sitemap from "../app/sitemap";

afterEach(() => vi.useRealTimers());

describe("public URL indexing regressions", () => {
  it("resolves every bus slug when URL-encoded, including the three broken Bangla routes", async () => {
    for (const b of buses) {
      const meta = await busMetadata({
        params: Promise.resolve({ slug: encodeURIComponent(b.slug) }),
      });
      expect(meta.alternates?.canonical).toBe(`/buses/${b.slug}`);
      expect(meta.robots).toMatchObject({ index: true });
    }
  });
  it("gives all 184 bus variants distinct titles and descriptions", async () => {
    const metadata = await Promise.all(
      buses.map((b) =>
        busMetadata({ params: Promise.resolve({ slug: b.slug }) }),
      ),
    );
    expect(new Set(metadata.map((m) => m.title)).size).toBe(buses.length);
    expect(new Set(metadata.map((m) => m.description)).size).toBe(buses.length);
  });
  it("resolves every listed stop and every bus-to-stop link", async () => {
    for (const s of stops) {
      const meta = await stopMetadata({
        params: Promise.resolve({ slug: encodeURIComponent(s.id) }),
      });
      expect(meta.alternates?.canonical).toBe(`/stops/${s.id}`);
    }
    const ids = new Set(stops.map((s) => s.id));
    for (const b of buses)
      for (const name of b.routeStops)
        expect(ids.has(slugify(name))).toBe(true);
  });
  it("keeps unknown routes at 404 instead of falling back to an unrelated bus", async () => {
    await expect(
      busMetadata({ params: Promise.resolve({ slug: "not-a-route" }) }),
    ).rejects.toThrow();
  });
  it.each(["%", "%E0%A4", "a%2Fb", "a%5Cb", "%00"])(
    "rejects malformed or encoded separators: %s",
    (slug) => {
      expect(decodeSlug(slug)).toBeNull();
    },
  );
  it("normalizes pagination canonicals and gives each indexable page a distinct title", () => {
    expect(
      paginatedMetadata("Buses", "Bus directory", "/buses", "01").alternates
        ?.canonical,
    ).toBe("/buses");
    expect(
      paginatedMetadata("Buses", "Bus directory", "/buses", "02"),
    ).toMatchObject({
      title: "Buses — Page 2",
      alternates: { canonical: "/buses?page=2" },
    });
    expect(() =>
      paginatedMetadata("Buses", "Bus directory", "/buses", "invalid"),
    ).toThrow();
  });
});

it("gives authors without a biography a useful description", async () => {
  authors.findOne.mockResolvedValue({
    name: "Raihan Miraj",
    slug: "raihan-miraj",
    userId: "author",
    bio: "",
  });
  const meta = await authorMetadata({
    params: Promise.resolve({ slug: "raihan-miraj" }),
    searchParams: Promise.resolve({}),
  });
  expect(meta.description).toBe(
    "Read Dhaka transport guides and bus route articles by Raihan Miraj on Dhaka Bus Routes.",
  );
  expect(meta.alternates?.canonical).toBe("/authors/raihan-miraj");
});

describe("metadata helpers and title patterns", () => {
  it("emits Open Graph site name, image alt and twitter large card defaults", () => {
    const meta = pageMeta("Example", "A useful description.", "/example");
    expect(meta.openGraph).toMatchObject({
      siteName: "Dhaka Bus Routes",
      url: "/example",
      images: [DEFAULT_OG_IMAGE],
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE],
    });
    expect(meta.alternates?.canonical).toBe("/example");
  });

  it("keeps bus, stop and journey titles unique and patterned", async () => {
    const busTitles = await Promise.all(
      buses.map((b) =>
        busMetadata({ params: Promise.resolve({ slug: b.slug }) }),
      ),
    );
    expect(new Set(busTitles.map((m) => m.title)).size).toBe(buses.length);
    expect(String(busTitles[0].title)).toMatch(/— .+ to .+: Route, Stops & Map$/);

    const stopTitles = await Promise.all(
      stops.map((s) =>
        stopMetadata({ params: Promise.resolve({ slug: s.id }) }),
      ),
    );
    expect(new Set(stopTitles.map((m) => m.title)).size).toBe(stops.length);
    expect(String(stopTitles[0].title)).toMatch(/— Buses & Routes$/);

    for (const j of curatedJourneys) {
      const meta = await journeyMetadata({
        params: Promise.resolve({ slug: j.slug }),
      });
      expect(String(meta.title)).toMatch(/— Bus Routes$/);
      expect(meta.alternates?.canonical).toBe(`/routes/${j.slug}`);
    }
  });

  it("keeps slug helpers shared between routes and the lightweight module", () => {
    expect(lightSlugify("Mirpur 10")).toBe(slugify("Mirpur 10"));
    expect(normalize("মিরপুর ১০")).toBe(normalize("মিরপুর 10"));
  });
});

describe("canonical origin", () => {
  const previous = process.env.SITE_URL;
  afterEach(() => {
    if (previous === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previous;
  });

  it("defaults to the preferred www production origin", () => {
    delete process.env.SITE_URL;
    expect(CANONICAL_ORIGIN).toBe("https://www.dhakabusroutes.com");
    expect(siteUrl()).toBe(CANONICAL_ORIGIN);
  });

  it("normalizes apex SITE_URL to www", () => {
    process.env.SITE_URL = "https://dhakabusroutes.com";
    expect(siteUrl()).toBe("https://www.dhakabusroutes.com");
  });
});

describe("sitemap dates and canonical URLs", () => {
  const previous = process.env.SITE_URL;
  beforeEach(() => {
    process.env.SITE_URL = CANONICAL_ORIGIN;
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previous;
  });

  it("uses editorial timestamps, encoded URLs, published posts and the actual static guide image", async () => {
    const modifiedAt = new Date("2026-10-07T06:58:14.028Z");
    posts.find.mockReturnValue({
      toArray: async () => [
        {
          published: {
            slug: "published-guide",
            publicModifiedAt: modifiedAt,
            featuredImage: { mediaId: "a".repeat(24) },
            content: { blocks: [] },
          },
        },
        { published: { slug: featuredGuide.slug } },
      ],
    });
    for (const c of [categories, tags, authors])
      c.find.mockReturnValue({ toArray: async () => [] });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
    const first = await sitemap();
    vi.setSystemTime(new Date("2026-10-13T00:00:00Z"));
    expect(await sitemap()).toEqual(first);
    expect(posts.find).toHaveBeenCalledWith(
      { status: "published", "published.indexable": true },
      { projection: { published: 1 } },
    );
    expect(new Set(first.map((e) => e.url)).size).toBe(first.length);
    expect(
      first.find((e) => e.url.endsWith(`/blog/${featuredGuide.slug}`)),
    ).toMatchObject({
      lastModified: featuredGuide.modifiedAt,
      images: [`${CANONICAL_ORIGIN}${featuredGuide.image}`],
    });
    expect(
      first.find((e) => e.url.endsWith("/blog/published-guide"))?.lastModified,
    ).toEqual(modifiedAt);
    expect(
      first.find((e) => e.url.endsWith("/about"))?.lastModified,
    ).toBeUndefined();
    const broken = buses.find((b) => b.id === 150)!;
    expect(
      first.some(
        (e) =>
          e.url === new URL(`/buses/${broken.slug}`, CANONICAL_ORIGIN).href,
      ),
    ).toBe(true);
    expect(first.every((e) => e.url.startsWith(CANONICAL_ORIGIN))).toBe(true);
  });
});
