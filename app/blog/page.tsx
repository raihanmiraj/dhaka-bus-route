import Link from "next/link";
import { BlogArchive } from "@/components/blog-archive";
import { Card } from "@/components/ui";
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
  const query = await searchParams;

  return (
    <>
      {!query.page && (
        <div className="grid" style={{ marginBottom: 24 }}>
          <Card>
            <h2 lang="bn">
              <Link href="/blog/dhaka-bus-travel-guide-2026">
                ঢাকায় বাসে যাতায়াতের পূর্ণাঙ্গ গাইড ২০২৬: রুট, স্টপেজ ও স্মার্ট ট্রাভেল টিপস
              </Link>
            </h2>
            <p lang="bn">
              ঢাকায় বাসে চলাচলের আগে কীভাবে সঠিক বাস রুট ও স্টপেজ খুঁজবেন, যাত্রা
              পরিকল্পনা করবেন এবং সময় বাঁচাবেন—জানুন এই ব্যবহারিক বাংলা গাইডে।
            </p>
            <Link href="/blog/dhaka-bus-travel-guide-2026">আর্টিকেল পড়ুন →</Link>
          </Card>
        </div>
      )}

      <BlogArchive
        title="Guides & articles"
        description="Practical reading to support your journey."
        base="/blog"
        query={query}
      />
    </>
  );
}
