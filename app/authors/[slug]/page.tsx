import { collections, publicPosts } from "@/lib/cms";
import { notFound } from "next/navigation";
import { BlogArchive } from "@/components/blog-archive";
import { metadata as meta } from "@/lib/seo";
export const dynamic = "force-dynamic";
async function get(p: Promise<{ slug: string }>) {
  const a = await (
    await collections()
  ).authors.findOne({ slug: (await p).slug });
  if (!a) notFound();
  return a;
}
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const a = await get(params);
  const q = await searchParams;
  const { total } = await publicPosts({ "published.authorId": a.userId });
  return meta(
    a.name,
    a.bio,
    `/authors/${a.slug}${q.page && q.page !== "1" ? `?page=${q.page}` : ""}`,
    total > 0,
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const a = await get(params);
  return (
    <BlogArchive
      title={a.name}
      description={a.bio}
      base={`/authors/${a.slug}`}
      query={await searchParams}
      filter={{ "published.authorId": a.userId }}
    />
  );
}
