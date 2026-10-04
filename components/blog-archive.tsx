import { publicPosts, collections } from "@/lib/cms";
import { PostCard, Pagination, EmptyState } from "./ui";
import { notFound, redirect } from "next/navigation";
import { pageNumber } from "@/lib/pagination";
import { Breadcrumbs } from "@/lib/seo";
export async function BlogArchive({
  title,
  description,
  base,
  query,
  filter = {},
  hideIntro = false,
}: {
  title: string;
  description: string;
  base: string;
  query: { page?: string };
  filter?: Record<string, unknown>;
  hideIntro?: boolean;
}) {
  if (query.page === "1") redirect(base);
  let page;
  try {
    page = pageNumber(query.page);
  } catch {
    notFound();
  }
  const result = await publicPosts(filter, page);
  if (page > 1 && (page - 1) * 12 >= result.total) notFound();
  const c = await collections();
  const categories = await c.categories
    .find()
    .sort({ name: 1 })
    .limit(100)
    .toArray();
  return (
    <>
      {!hideIntro && (
        <Breadcrumbs
          items={[
            { name: "Blog", href: "/blog" },
            ...(base !== "/blog" ? [{ name: title, href: base }] : []),
          ]}
        />
      )}
      {!hideIntro && (
        <>
          <h1>{title}</h1>
          <p>{description}</p>
        </>
      )}
      <nav className="row" aria-label="Article categories">
        {categories.map((t) => (
          <a
            key={String(t._id)}
            className="badge"
            href={`/blog/category/${t.slug}`}
          >
            {t.name}
          </a>
        ))}
      </nav>
      <div className="grid" style={{ marginTop: 24 }}>
        {result.items.map((p) => (
          <PostCard key={String(p._id)} post={p.published!} />
        ))}
      </div>
      {!result.total && (
        <EmptyState>No articles have been published here yet.</EmptyState>
      )}
      <Pagination
        page={page}
        total={Math.ceil(result.total / 12)}
        base={base}
      />
    </>
  );
}
