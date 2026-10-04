import { article, articleMetadata } from "@/lib/blog";
import { Breadcrumbs, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";
import { ArticleBody, TableOfContents } from "@/components/article";
import { ArticleTracking } from "@/components/tracking";
import { BlogEngagement } from "@/components/blog-engagement";
import { collections, oid, publicPosts } from "@/lib/cms";
import { db } from "@/lib/db";
import { PostCard } from "@/components/ui";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return articleMetadata((await params).slug);
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await article((await params).slug);
  const c = await collections();
  const featured = p.featuredImage
    ? await (
        await db()
      )
        .collection("media")
        .findOne({ _id: oid(p.featuredImage.mediaId) })
    : null;
  const category = p.primaryCategoryId
    ? await c.categories.findOne({ _id: oid(p.primaryCategoryId) })
    : null;
  const tags = await c.tags.find({ _id: { $in: p.tagIds.map(oid) } }).toArray();
  const related = await publicPosts(
    {
      "published.slug": { $ne: p.slug },
      "published.categoryIds": { $in: p.categoryIds },
    },
    1,
    3,
  );
  const date = (d: Date) =>
    d.toLocaleDateString(p.locale === "bn" ? "bn-BD" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Dhaka",
    });
  return (
    <article lang={p.locale}>
      <ArticleTracking />
      <Breadcrumbs
        items={[
          { name: "Blog", href: "/blog" },
          { name: p.title, href: `/blog/${p.slug}` },
        ]}
      />
      <header className="article-header">
        {category && (
          <a href={`/blog/category/${category.slug}`}>{category.name}</a>
        )}
        <h1>{p.title}</h1>
        <p>{p.excerpt}</p>
        <p>
          By <a href={`/authors/${p.authorSlug}`}>{p.authorName}</a>
        </p>
        <p>
          Published{" "}
          <time dateTime={p.firstPublishedAt.toISOString()}>
            {date(p.firstPublishedAt)}
          </time>{" "}
          · Updated{" "}
          <time dateTime={p.publicModifiedAt.toISOString()}>
            {date(p.publicModifiedAt)}
          </time>
        </p>
        {p.featuredImage && (
          <figure>
            <img
              className="media-img"
              src={`/media/${p.featuredImage.mediaId}`}
              alt={p.featuredImage.alt}
              width={featured?.width}
              height={featured?.height}
            />
            <figcaption>{p.featuredImage.caption}</figcaption>
          </figure>
        )}
        <TableOfContents content={p.content} />
      </header>
      <ArticleBody content={p.content} />
      <div className="prose">
        {p.sources.length > 0 && (
          <>
            <h2>Sources</h2>
            <ul>
              {p.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        {p.routeLinks.length > 0 && (
          <>
            <h2>Explore these routes and stops</h2>
            <ul>
              {p.routeLinks.map((h) => (
                <li key={h}>
                  <a href={h}>
                    {decodeURIComponent(h.split("/").pop()!).replaceAll(
                      "-",
                      " ",
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        <nav className="row" aria-label="Tags">
          {tags.map((t) => (
            <a key={String(t._id)} href={`/blog/tag/${t.slug}`}>
              {t.name}
            </a>
          ))}
        </nav>
      </div>
      <BlogEngagement slug={p.slug} />
      {related.items.length > 0 && (
        <>
          <h2>Related reading</h2>
          <div className="grid">
            {related.items.map((r) => (
              <PostCard key={String(r._id)} post={r.published!} />
            ))}
          </div>
        </>
      )}
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: p.title,
          description: p.excerpt,
          inLanguage: p.locale,
          mainEntityOfPage: siteUrl() + `/blog/${p.slug}`,
          datePublished: p.firstPublishedAt.toISOString(),
          dateModified: p.publicModifiedAt.toISOString(),
          author: {
            "@type": "Person",
            name: p.authorName,
            url: siteUrl() + `/authors/${p.authorSlug}`,
          },
          image: p.featuredImage
            ? siteUrl() + `/media/${p.featuredImage.mediaId}`
            : undefined,
        }}
      />
    </article>
  );
}
