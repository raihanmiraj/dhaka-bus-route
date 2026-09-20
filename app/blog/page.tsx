import { BlogArchive } from "@/components/blog-archive";
import { metadata as meta } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const q = await searchParams;
  return meta(
    "Guides & articles",
    "Published articles to help you use Dhaka Bus Routes.",
    `/blog${q.page && q.page !== "1" ? `?page=${q.page}` : ""}`,
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <BlogArchive
      title="Guides & articles"
      description="Practical reading to support your journey."
      base="/blog"
      query={await searchParams}
    />
  );
}
