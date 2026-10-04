import { RecentPosts } from "@/components/recent-posts";
import Search from "@/components/search";
import { metadata as pageMeta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";
import {
  coverage,
  journeyHighlights,
  popularStops,
  routePreview,
} from "@/lib/landing";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiFlag,
  FiGlobe,
  FiLayers,
  FiMap,
  FiMapPin,
  FiMessageCircle,
  FiNavigation,
  FiShield,
} from "react-icons/fi";

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

const steps = [
  {
    icon: FiMapPin,
    title: "Choose your boarding stop",
    body: "Type in English or বাংলা and pick the exact stop from the suggestions.",
  },
  {
    icon: FiNavigation,
    title: "Set your destination",
    body: "We check every listed route that passes both stops in the right order.",
  },
  {
    icon: FiMap,
    title: "Compare buses and view the map",
    body: "Routes are ranked by fewest stops. Open any bus to see its stops plotted on OpenStreetMap.",
  },
];

const features = [
  {
    icon: FiLayers,
    title: "Direct route matching",
    body: "Only buses that serve both stops in source order are shown — no guesswork.",
  },
  {
    icon: FiMap,
    title: "OpenStreetMap view",
    body: "See the approximate path of each bus with start, stops and end marked.",
  },
  {
    icon: FiGlobe,
    title: "English & বাংলা",
    body: "Search with either script. Common spelling variants are recognised.",
  },
  {
    icon: FiMessageCircle,
    title: "Community guides",
    body: "Practical articles from passengers, with likes and comments.",
  },
];

function RoutePreview() {
  const preview = routePreview;
  if (!preview) return null;
  const shown =
    preview.stops.length > 6
      ? [...preview.stops.slice(0, 3), null, ...preview.stops.slice(-2)]
      : preview.stops;
  return (
    <aside className="hero-preview" aria-label="Example journey">
      <div className="preview-head">
        <span className="preview-live">Example journey</span>
        <span className="preview-count">{preview.buses} buses</span>
      </div>
      <p className="preview-title">
        {preview.from} <FiArrowRight aria-hidden /> {preview.to}
      </p>
      <p className="preview-bus">{preview.bus}</p>
      <ol className="preview-line">
        {shown.map((s, i) =>
          s === null ? (
            <li key="gap" className="is-gap">
              +{preview.stops.length - 5} more stops
            </li>
          ) : (
            <li
              key={`${s}-${i}`}
              className={
                i === 0 ? "is-start" : i === shown.length - 1 ? "is-end" : ""
              }
            >
              {s}
            </li>
          ),
        )}
      </ol>
      <Link
        className="preview-link"
        href={`/?from=${encodeURIComponent(preview.from)}&to=${encodeURIComponent(preview.to)}#search`}
      >
        See all matching buses <FiArrowRight aria-hidden />
      </Link>
    </aside>
  );
}

export default function Home() {
  return (
    <div className="home">
      <Search
        popular={popularStops.slice(0, 6)}
        aside={<RoutePreview />}
        intro={
          <>
            <span className="hero-pill">
              <FiCheckCircle aria-hidden /> Free · No sign-up · Bilingual
            </span>
            <h1 id="home-title">Find your bus across Dhaka.</h1>
            <p className="hero-lead">
              Enter where you board and where you&apos;re going. We match direct
              buses from {coverage.routes} listed routes and show every stop
              before you travel.
            </p>
          </>
        }
      />

      <section className="stats-strip" aria-label="Coverage">
        <div>
          <strong>{coverage.routes}</strong>
          <span>Listed bus routes</span>
        </div>
        <div>
          <strong>{coverage.stops}</strong>
          <span>Stops indexed</span>
        </div>
        <div>
          <strong>2</strong>
          <span>Languages supported</span>
        </div>
        <div>
          <strong>OSM</strong>
          <span>Route maps</span>
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-title">
        <div className="section-intro">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">Plan a trip in three steps</h2>
        </div>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step-num">{i + 1}</span>
              <s.icon aria-hidden className="step-icon" size={22} />
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {journeyHighlights.length > 0 && (
        <section className="home-section" aria-labelledby="journeys-title">
          <div className="section-intro section-intro-row">
            <div>
              <p className="eyebrow">Popular journeys</p>
              <h2 id="journeys-title">Start with a common trip</h2>
            </div>
            <Link className="section-link" href="/routes">
              All journeys <FiArrowRight aria-hidden />
            </Link>
          </div>
          <div className="journey-grid">
            {journeyHighlights.map((j) => (
              <Link
                className="journey-card"
                key={`${j.from}-${j.to}`}
                href={j.href}
              >
                <div className="journey-stops">
                  <span className="journey-dot is-start" aria-hidden />
                  <strong>{j.from}</strong>
                  <span className="journey-dash" aria-hidden />
                  <span className="journey-dot is-end" aria-hidden />
                  <strong>{j.to}</strong>
                </div>
                <div className="journey-meta">
                  <span>
                    {j.buses} {j.buses === 1 ? "bus" : "buses"}
                  </span>
                  <span>From {j.fewestStops} stops</span>
                </div>
                <span className="journey-cta">
                  View buses <FiArrowRight aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="features-title">
        <div className="section-intro">
          <p className="eyebrow">Why Dhaka Bus Routes</p>
          <h2 id="features-title">Built for everyday passengers</h2>
        </div>
        <div className="feature-cards">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">
                <f.icon aria-hidden size={20} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <RecentPosts />

      <section className="cta-band" aria-labelledby="cta-title">
        <div>
          <span className="cta-icon">
            <FiShield aria-hidden size={22} />
          </span>
          <h2 id="cta-title">Honest data, improved by passengers</h2>
          <p>
            Fares, timetables and live status aren&apos;t available, and routes
            are awaiting verification. If something has changed, tell us — every
            report is reviewed.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="button cta-primary" href="/report-route">
            <FiFlag aria-hidden /> Report a correction
          </Link>
          <Link className="button cta-secondary" href="/data-sources">
            How we use route data
          </Link>
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
    </div>
  );
}
