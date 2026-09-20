import { archive } from "@/lib/archive";
import { BlogArchive } from "@/components/blog-archive";
import { metadata as meta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const { t, index } = await archive("tags", (await params).slug);
  const q = await searchParams;
  return meta(
    t.seoTitle || t.name,
    t.seoDescription || t.description,
    `/blog/tag/${t.slug}${q.page && q.page !== "1" ? `?page=${q.page}` : ""}`,
    index,
  );
}
export default async function Page({ params, searchParams }: Props) {
  const { t, filter } = await archive("tags", (await params).slug);
  return (
    <BlogArchive
      title={t.name}
      description={t.description}
      base={`/blog/tag/${t.slug}`}
      query={await searchParams}
      filter={filter}
    />
  );
}
