import { describe, it, expect } from "vitest";
import {
  normalize,
  resolveStop,
  suggestions,
  journeys,
  buses,
  stops,
  slugify,
} from "../lib/routes";
import {
  draftSchema,
  blankDraft,
  contentSchema,
  inline,
  publicationIssues,
  slugSchema,
} from "../lib/content";
import { administrator, sameOrigin, HttpError } from "../lib/auth";
describe("route matching", () => {
  it("preserves Bangla and normalizes digits", () => {
    expect(normalize("মিরপুর ১০")).toBe("মিরপুর 10");
    expect(resolveStop("মিরপুর ১০").id).toBe("mirpur-10");
  });
  it("distinguishes numbered stops and retains exact suggestions", () => {
    expect(resolveStop("Mirpur 1").id).not.toBe(resolveStop("Mirpur 10").id);
    expect(suggestions("Mirpur 1")[0].id).toBe("mirpur-1");
  });
  it("rejects ambiguity and resolved same stop", () => {
    expect(() => resolveStop("Mirpur")).toThrow("specific");
    expect(() => resolveStop("Dhanmondi")).toThrow("specific");
    expect(() => journeys("মিরপুর ১০", "Mirpur 10")).toThrow("different");
  });
  it("uses the selected source-order segment only", () => {
    const result = journeys("mirpur-10", "farmgate");
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.segment[0]).toBe("Mirpur 10");
      expect(r.segment.at(-1)).toBe("Farmgate");
      expect(r.bus.routeStops.indexOf("Farmgate")).toBeGreaterThan(
        r.bus.routeStops.indexOf("Mirpur 10"),
      );
    }
  });
  it("has collision-free variant identities", () => {
    expect(new Set(buses.map((b) => b.slug)).size).toBe(buses.length);
    expect(slugify("New Road ১")).toBe("new-road-1");
    expect(slugSchema.safeParse("admin").success).toBe(false);
  });
});
describe("canonical block validation", () => {
  it("sanitizes inline markup and script protocols", () => {
    const value = inline(
      '<script>alert(1)</script><b onclick="x()">OK</b><a href="javascript:alert(1)">Bad</a><img src=x onerror=x()>',
    );
    expect(value).toContain("<b>OK</b>");
    expect(value).not.toMatch(/script|onclick|onerror|<img/);
  });
  it("rejects unknown blocks and H1", () => {
    expect(
      contentSchema.safeParse({
        blocks: [{ type: "raw", data: { html: "<script/>" } }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        blocks: [{ type: "header", data: { text: "X", level: 1 } }],
      }).success,
    ).toBe(false);
  });
  it("accepts Editor.js nested list and table shapes", () => {
    const d = contentSchema.parse({
      blocks: [
        {
          type: "list",
          data: {
            style: "ordered",
            meta: { start: 1, counterType: "numeric" },
            items: [
              {
                content: "Parent",
                meta: {},
                items: [{ content: "Child", meta: {}, items: [] }],
              },
            ],
          },
        },
        {
          type: "table",
          data: {
            withHeadings: true,
            stretched: false,
            content: [
              ["A", "B"],
              ["C", "D"],
            ],
          },
        },
      ],
    });
    expect(d.blocks).toHaveLength(2);
  });
  it("enforces primary membership and deduplicates terms", () => {
    const d = blankDraft("example");
    d.categoryIds = ["a".repeat(24), "a".repeat(24)];
    expect(draftSchema.parse(d).categoryIds).toHaveLength(1);
    d.primaryCategoryId = "b".repeat(24);
    expect(draftSchema.safeParse(d).success).toBe(false);
  });
  it("checks publication fields", () => {
    expect(publicationIssues(blankDraft("example")).length).toBeGreaterThan(3);
  });
});
describe("authorization", () => {
  it("rejects editor publishing permissions", () =>
    expect(() =>
      administrator({ id: "x", name: "Editor", role: "editor" }),
    ).toThrow(HttpError));
  it("rejects missing and foreign origins", () => {
    process.env.SITE_URL = "http://localhost:3000";
    expect(() => sameOrigin(new Request("http://localhost:3000"))).toThrow();
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000", {
          headers: { origin: "https://evil.invalid" },
        }),
      ),
    ).toThrow();
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
  });
});

it("rejects mismatched image URLs and unbounded nested lists", () => {
  expect(
    contentSchema.safeParse({
      blocks: [
        {
          type: "image",
          data: {
            file: {
              url: "/media/" + "a".repeat(24),
              mediaId: "b".repeat(24),
              width: 10,
              height: 10,
            },
            alt: "Image",
            caption: "",
          },
        },
      ],
    }).success,
  ).toBe(false);
  let item = { content: "Nested", items: [] as unknown[] };
  for (let i = 0; i < 8; i++) item = { content: "Nested", items: [item] };
  expect(
    contentSchema.safeParse({
      blocks: [{ type: "list", data: { style: "unordered", items: [item] } }],
    }).success,
  ).toBe(false);
});

it("assigns unique stop identities while preserving casing aliases", () => {
  expect(new Set(stops.map((s) => s.id)).size).toBe(stops.length);
  expect(resolveStop("Sony CInema Hall").id).toBe("sony-cinema-hall");
});
