import { z } from "zod";
import sanitizeHtml from "sanitize-html";
export const idSchema = z.string().regex(/^[a-f0-9]{24}$/, "Invalid ID");
export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(
    /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u,
    "Use words separated by hyphens",
  )
  .refine(
    (s) =>
      ![
        "new",
        "edit",
        "admin",
        "api",
        "category",
        "tag",
        "feed",
        "page",
      ].includes(s),
    "Reserved slug",
  )
  .refine(
    (s) => s === s.normalize("NFKC").toLowerCase(),
    "Use a normalized lowercase slug",
  );
export function safeUrl(value: string) {
  return /^https?:\/\/[^\s]+$/i.test(value) || /^\/(?!\/)[^\\\s]*$/.test(value);
}
export const inline = (s: string) =>
  sanitizeHtml(s, {
    allowedTags: ["b", "strong", "i", "em", "a", "br"],
    allowedAttributes: { a: ["href", "title", "rel"] },
    allowedSchemes: ["https", "http"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs:
          attrs.href && safeUrl(attrs.href)
            ? { href: attrs.href, rel: "noopener noreferrer" }
            : ({} as Record<string, string>),
      }),
    },
  });
const text = z.string().max(30000).transform(inline);
type ListItem = {
  content: string;
  meta?: Record<string, unknown>;
  items: ListItem[];
};
function nestedList(depth: number): z.ZodType<ListItem> {
  return z.object({
    content: text,
    meta: z.record(z.string(), z.unknown()).optional(),
    items:
      depth >= 5
        ? z.array(z.never()).max(0)
        : z.array(z.lazy(() => nestedList(depth + 1))).max(100),
  });
}
const listItem = nestedList(1);
const imageFile = z
  .object({
    url: z.string().regex(/^\/media\/[a-f0-9]{24}$/),
    mediaId: idSchema,
    width: z.number().int().positive().max(8000),
    height: z.number().int().positive().max(8000),
  })
  .refine(
    (f) => f.url === `/media/${f.mediaId}`,
    "Image URL must match its media ID",
  );
export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("paragraph"),
    data: z.object({ text }),
  }),
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("header"),
    data: z.object({
      text,
      level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    }),
  }),
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("list"),
    data: z.object({
      style: z.enum(["ordered", "unordered"]),
      meta: z.record(z.string(), z.unknown()).optional(),
      items: z.array(listItem).max(100),
    }),
  }),
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("quote"),
    data: z.object({
      text,
      caption: text.default(""),
      alignment: z.enum(["left", "center"]).optional(),
    }),
  }),
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("image"),
    data: z.object({
      file: imageFile,
      alt: z.string().max(500).default(""),
      caption: text.default(""),
      withBorder: z.boolean().optional(),
      stretched: z.boolean().optional(),
      withBackground: z.boolean().optional(),
    }),
  }),
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("table"),
    data: z.object({
      withHeadings: z.boolean().default(false),
      stretched: z.boolean().optional(),
      content: z.array(z.array(text).min(1).max(20)).min(1).max(100),
    }),
  }),
  z.object({
    id: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    type: z.literal("delimiter"),
    data: z.object({}),
  }),
]);
export const contentSchema = z.object({
  time: z.number().optional(),
  version: z.string().optional(),
  blocks: z.array(blockSchema).max(400),
});
const ids = z
  .array(idSchema)
  .max(30)
  .transform((a) => [...new Set(a)]);
export const draftSchema = z
  .object({
    title: z.string().max(200),
    slug: slugSchema,
    excerpt: z.string().max(600),
    locale: z.enum(["en", "bn"]).default("en"),
    translationGroup: z.string().max(100).nullable().default(null),
    contentSchemaVersion: z.literal(1).default(1),
    content: contentSchema,
    categoryIds: ids,
    tagIds: ids,
    primaryCategoryId: idSchema.nullable(),
    featuredImage: z
      .object({
        mediaId: idSchema,
        alt: z.string().max(500),
        caption: z.string().max(1000),
      })
      .nullable(),
    sources: z
      .array(
        z.object({
          label: z.string().min(1).max(200),
          url: z
            .string()
            .url()
            .refine((s) => /^https?:/.test(s)),
        }),
      )
      .max(30),
    seoTitle: z.string().max(200),
    seoDescription: z.string().max(500),
    socialImageId: idSchema.nullable(),
    indexable: z.boolean().default(true),
    routeLinks: z
      .array(z.string().regex(/^\/(?:buses|stops|routes)\/[\p{L}\p{N}-]+$/u))
      .max(30),
  })
  .superRefine((d, c) => {
    if (d.primaryCategoryId && !d.categoryIds.includes(d.primaryCategoryId))
      c.addIssue({
        code: "custom",
        message: "Primary category must be selected",
        path: ["primaryCategoryId"],
      });
    const raw = JSON.stringify(d.content);
    if (raw.length > 500000)
      c.addIssue({
        code: "custom",
        message: "Article exceeds 500 KB",
        path: ["content"],
      });
  });
export type Draft = z.infer<typeof draftSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Snapshot = Draft & {
  authorId: string;
  authorName: string;
  authorSlug: string;
  firstPublishedAt: Date;
  publicModifiedAt: Date;
};
export const taxonomySchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema,
  description: z.string().max(2000),
  seoTitle: z.string().max(200),
  seoDescription: z.string().max(500),
  locale: z.enum(["en", "bn"]),
  indexable: z.boolean().default(false),
});
export type Taxonomy = z.infer<typeof taxonomySchema>;
export function publicationIssues(d: Draft) {
  const issues: string[] = [];
  if (!d.title.trim()) issues.push("Add a title.");
  if (!d.excerpt.trim()) issues.push("Add an excerpt.");
  if (!d.content.blocks.length) issues.push("Write article content.");
  if (!d.categoryIds.length || !d.primaryCategoryId)
    issues.push("Select a primary category.");
  if (!d.seoDescription.trim()) issues.push("Add a meta description.");
  if (!d.featuredImage?.alt.trim())
    issues.push("Select a featured image with alt text.");
  for (const b of d.content.blocks)
    if (b.type === "image" && !b.data.alt.trim())
      issues.push("Every article image needs alt text.");
  return issues;
}
export const mediaIds = (d: Draft) => [
  ...new Set(
    [
      d.featuredImage?.mediaId,
      d.socialImageId,
      ...d.content.blocks.flatMap((b) =>
        b.type === "image" ? [b.data.file.mediaId] : [],
      ),
    ].filter((v): v is string => !!v),
  ),
];
export const blankDraft = (slug: string): Draft => ({
  title: "",
  slug,
  excerpt: "",
  locale: "en",
  translationGroup: null,
  contentSchemaVersion: 1,
  content: { blocks: [] },
  categoryIds: [],
  tagIds: [],
  primaryCategoryId: null,
  featuredImage: null,
  sources: [],
  seoTitle: "",
  seoDescription: "",
  socialImageId: null,
  indexable: true,
  routeLinks: [],
});
export function headingId(index: number, blockId?: string) {
  return blockId ? `heading-${blockId}` : `heading-${index + 1}`;
}
export function plain(s: string) {
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });
}
