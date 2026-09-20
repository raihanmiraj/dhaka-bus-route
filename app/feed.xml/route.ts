import { publicPosts } from "@/lib/cms";
import { siteUrl } from "@/lib/config";
import { failure } from "@/lib/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export async function GET() {
  try {
    const { items } = await publicPosts({}, 1, 50);
    const base = siteUrl();
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Dhaka Bus Routes</title><link>${base}/blog</link><description>Published articles from Dhaka Bus Routes</description>${items.map(({ published: p }) => (p ? `<item><title>${xml(p.title)}</title><link>${base}/blog/${xml(p.slug)}</link><guid>${base}/blog/${xml(p.slug)}</guid><description>${xml(p.excerpt)}</description><pubDate>${p.firstPublishedAt.toUTCString()}</pubDate></item>` : "")).join("")}</channel></rss>`,
      {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
