import { RecentPosts } from "@/components/recent-posts";
import Search from "@/components/search";
import { metadata as pageMeta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";
import { curatedJourneys, resolveStop } from "@/lib/routes";
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
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">Dhaka Bus Routes</p>
        <h1 id="home-title">Find the right bus across the city.</h1>
        <p>
          Enter your boarding stop and destination. We match direct routes from
          the listed dataset so you can see stops before you travel.
        </p>
      </section>

      <Search />

      <section style={{ marginTop: 36 }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Popular journeys</p>
            <h2>Explore listed journeys</h2>
            <p>
              Quick starting points from the source dataset. Operating details
              are not independently verified.
            </p>
          </div>
          <Link href="/routes">All journeys →</Link>
        </div>
        <div className="grid">
          {curatedJourneys.map((j) => (
            <Link className="card journey-chip" key={j.slug} href={`/routes/${j.slug}`}>
              <span className="badge">Direct match</span>
              <strong>
                {resolveStop(j.from).name} → {resolveStop(j.to).name}
              </strong>
              <span className="muted">View matching buses and stops</span>
            </Link>
          ))}
        </div>
      </section>

      <RecentPosts />

      <section className="grid feature-grid">
        <div className="card">
          <p className="eyebrow">Before you board</p>
          <h2>Know what we show</h2>
          <p>
            Fares, schedules and live service status are not available. Confirm
            with the operator locally.
          </p>
          <Link href="/data-sources">How we use route data →</Link>
        </div>
        <div className="card">
          <p className="eyebrow">Guides & community</p>
          <h2>Travel tips & updates</h2>
          <p>
            Read practical articles, like what helps you, and leave a comment for
            fellow passengers.
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
