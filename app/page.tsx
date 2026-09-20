import { RecentPosts } from "@/components/recent-posts";
import Search from "@/components/search";
import { metadata as pageMeta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";
import { curatedJourneys } from "@/lib/routes";
import Link from "next/link";
const homeMetadata = pageMeta(
  "Find a bus in Dhaka",
  "Search listed Dhaka bus routes by boarding stop and destination. Browse buses, stops and journey information.",
  "/",
);
export const dynamic = "force-dynamic";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  return {
    ...homeMetadata,
    robots: { index: !Object.keys(q).length, follow: true },
  };
}
export default function Home() {
  return (
    <>
      <div className="hero">
        <p className="eyebrow">Your everyday journey, made clearer</p>
        <h1>Find your bus across Dhaka.</h1>
        <p>
          Choose where you’re boarding and where you want to go. Explore the
          stops along a matching route before you travel.
        </p>
      </div>
      <Search />
      <RecentPosts />
      <section>
        <h2>Explore listed journeys</h2>
        <p>
          These journeys match the source dataset. Operating details have not
          been independently verified.
        </p>
        <div className="grid">
          {curatedJourneys.map((j) => (
            <Link className="card" key={j.slug} href={`/routes/${j.slug}`}>
              {j.slug.replaceAll("-", " ")} →
            </Link>
          ))}
        </div>
      </section>
      <section className="grid" style={{ marginTop: 32 }}>
        <div className="card">
          <h2>Know before you board</h2>
          <p>
            Fares, schedules and live service status are not available. Confirm
            with the operator locally.
          </p>
          <Link href="/data-sources">How we use route data →</Link>
        </div>
        <div className="card">
          <h2>Guides & updates</h2>
          <p>
            Read published articles from our editorial team, or help improve a
            route listing.
          </p>
          <Link href="/blog">Visit the blog →</Link>
          <p>
            <Link href="/report-route">Report a correction</Link>
          </p>
        </div>
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Dhaka Bus Routes",
          url: siteUrl(),
        }}
      />
    </>
  );
}
