import "server-only";
import { collections, publicPosts } from "./cms";
import { db } from "./db";
import { notFound, permanentRedirect } from "next/navigation";
import { siteUrl } from "./config";
import { metadata } from "./seo";
import type { Metadata } from "next";
import { decodeSlug } from "./url";
export async function article(slug: string) {
  const decoded = decodeSlug(slug);
  if (!decoded) notFound();
  slug = decoded;
  const c = await collections();
  const p = await c.posts.findOne(
    { status: "published", "published.slug": slug },
    { projection: { published: 1 } },
  );
  if (p?.published) return p.published;
  const r = await (
    await db()
  )
    .collection("redirects")
    .findOne({ _id: slug as never });
  if (r) {
    const target = await c.posts.findOne(
      {
        _id: new (await import("mongodb")).ObjectId(r.postId),
        status: "published",
      },
      { projection: { "published.slug": 1 } },
    );
    if (target?.published?.slug && target.published.slug !== slug)
      permanentRedirect(`/blog/${target.published.slug}`);
  }
  notFound();
}
export async function articleMetadata(slug: string): Promise<Metadata> {
  const p = await article(slug);
  const base = metadata(
    p.seoTitle || p.title,
    p.seoDescription || p.excerpt,
    `/blog/${p.slug}`,
    p.indexable,
  );
  const translations = p.translationGroup
    ? (await publicPosts({ "published.translationGroup": p.translationGroup }))
        .items
    : [];
  const title = p.seoTitle || p.title;
  const description = p.seoDescription || p.excerpt;
  const imageUrl = p.socialImageId
    ? `/media/${p.socialImageId}`
    : p.featuredImage
      ? `/media/${p.featuredImage.mediaId}`
      : undefined;
  const images = imageUrl
    ? [
        {
          url: imageUrl,
          alt: p.featuredImage?.alt || title,
        },
      ]
    : [];
  return {
    ...base,
    alternates: {
      canonical: `/blog/${p.slug}`,
      ...(translations.length > 1
        ? {
            languages: Object.fromEntries(
              translations.map((t) => [
                t.published!.locale,
                `${siteUrl()}/blog/${t.published!.slug}`,
              ]),
            ),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    openGraph: {
      title,
      description,
      url: `/blog/${p.slug}`,
      type: "article",
      siteName: "Dhaka Bus Routes",
      publishedTime: p.firstPublishedAt.toISOString(),
      modifiedTime: p.publicModifiedAt.toISOString(),
      authors: [p.authorName],
      locale: p.locale === "bn" ? "bn_BD" : "en_US",
      images,
    },
  };
}
