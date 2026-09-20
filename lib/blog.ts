import "server-only";
import { collections, publicPosts } from "./cms";
import { db } from "./db";
import { notFound, permanentRedirect } from "next/navigation";
import { siteUrl } from "./config";
import { metadata } from "./seo";
import type { Metadata } from "next";
export async function article(slug: string) {
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
      title: p.seoTitle || p.title,
      description: p.seoDescription || p.excerpt,
      images: p.socialImageId
        ? [`/media/${p.socialImageId}`]
        : p.featuredImage
          ? [`/media/${p.featuredImage.mediaId}`]
          : [],
    },
    openGraph: {
      title: p.seoTitle || p.title,
      description: p.seoDescription,
      url: `/blog/${p.slug}`,
      type: "article",
      publishedTime: p.firstPublishedAt.toISOString(),
      modifiedTime: p.publicModifiedAt.toISOString(),
      authors: [p.authorName],
      locale: p.locale === "bn" ? "bn_BD" : "en_US",
      images: p.socialImageId
        ? [`/media/${p.socialImageId}`]
        : p.featuredImage
          ? [`/media/${p.featuredImage.mediaId}`]
          : [],
    },
  };
}
