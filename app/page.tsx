import { RecentPosts } from "@/components/recent-posts";
import Search from "@/components/search";
import { metadata as pageMeta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";
import {
  coverage,
  journeyHighlights,
  popularStops,
  seoFaqs,
} from "@/lib/landing";
import Link from "next/link";
import {
  FiArrowRight,
  FiFlag,
  FiMapPin,
  FiNavigation,
  FiSearch,
} from "react-icons/fi";

const homeTitle =
  "Dhaka Bus Route Finder — Search Local Bus Routes & Stops";
const homeDescription =
  "Find Dhaka bus routes by boarding stop and destination. Free local bus route finder with maps — Mirpur, Farmgate, Motijheel and more. English ও বাংলা.";
const homeMetadata = pageMeta(homeTitle, homeDescription, "/");

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  return {
    ...homeMetadata,
    // Prefer absolute so the layout title template does not append a second brand suffix.
    title: { absolute: homeTitle },
    robots: { index: !Object.keys(q).length, follow: true },
  };
}

const steps = [
  {
    icon: FiMapPin,
    title: "Pick origin & destination",
    body: "Type a stop in English or বাংলা, or use Current Location to auto-fill the nearest stop.",
  },
  {
    icon: FiSearch,
    title: "Search matching buses",
    body: "We show direct Dhaka city buses that pass both stops in the listed order.",
  },
  {
    icon: FiNavigation,
    title: "Open the route map",
    body: "Compare stop counts, then open any bus page for the full stop list and OpenStreetMap path.",
  },
];

export default function Home() {
  return (
    <div className="home">
      <Search
        popular={popularStops.slice(0, 6)}
        intro={
          <>
            <p className="hero-bn" lang="bn">
              ঢাকা শহরে বাস রুট ও স্টপ খুঁজুন
            </p>
            <h1 id="home-title">Dhaka bus route finder</h1>
            <p className="hero-lead">
              Search {coverage.routes} listed local bus routes by stop. Tap Use
              Current Location to start from the nearest stop — then choose where
              you&apos;re going.
            </p>
          </>
        }
      />

      <section className="stats-strip" aria-label="Coverage">
        <div>
          <strong>{coverage.routes}</strong>
          <span>Bus routes</span>
        </div>
        <div>
          <strong>{coverage.stops}</strong>
          <span>Stops indexed</span>
        </div>
        <div>
          <strong>EN · বাং</strong>
          <span>Bilingual search</span>
        </div>
        <div>
          <strong>Near me</strong>
          <span>Current location</span>
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-title">
        <div className="section-intro">
          <p className="eyebrow">Easy search</p>
          <h2 id="how-title">Find a bus in three steps</h2>
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
              <h2 id="journeys-title">Start with a common Dhaka trip</h2>
              <p className="section-lead">
                One-tap searches for routes people look up most — Farmgate,
                Mirpur, Motijheel and more.
              </p>
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

      <section className="home-section seo-block" aria-labelledby="about-finder">
        <div className="section-intro">
          <p className="eyebrow">Dhaka local buses</p>
          <h2 id="about-finder">Plan city bus travel without the guesswork</h2>
        </div>
        <div className="seo-grid">
          <div>
            <p>
              Looking up a <strong>Dhaka bus route</strong> usually means asking
              around at the stop. This free finder lists{" "}
              <strong>Dhaka city bus routes</strong> by boarding stop and
              destination so you can compare direct options before you leave.
            </p>
            <p>
              Search works in English and বাংলা. Use Current Location when you
              need a <strong>bus stop near me</strong>, browse the{" "}
              <Link href="/buses">full bus list</Link>, or open any{" "}
              <Link href="/stops">stop page</Link> to see which buses call there.
            </p>
          </div>
          <ul className="seo-links">
            <li>
              <Link href="/buses">All Dhaka bus services</Link>
            </li>
            <li>
              <Link href="/stops">Bus stops directory</Link>
            </li>
            <li>
              <Link href="/routes">Popular route pages</Link>
            </li>
            <li>
              <Link href="/blog">Travel guides & tips</Link>
            </li>
            <li>
              <Link href="/data-sources">How we use route data</Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="home-section" aria-labelledby="faq-title">
        <div className="section-intro">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title">Common questions</h2>
        </div>
        <div className="faq-list">
          {seoFaqs.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <RecentPosts />

      <section className="cta-band" aria-labelledby="cta-title">
        <div>
          <h2 id="cta-title">See a wrong stop or missing bus?</h2>
          <p>
            Routes are listed from public sources and still need verification.
            Send a correction — every report is reviewed.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="button cta-primary" href="/report-route">
            <FiFlag aria-hidden /> Report a correction
          </Link>
          <Link className="button cta-secondary" href="/data-sources">
            Data sources
          </Link>
        </div>
      </section>

      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "Dhaka Bus Routes",
              url: siteUrl(),
              description: homeDescription,
              inLanguage: ["en", "bn"],
              publisher: { "@id": `${siteUrl()}/#organization` },
            },
            {
              "@type": "Organization",
              "@id": `${siteUrl()}/#organization`,
              name: "Dhaka Bus Routes",
              url: siteUrl(),
              logo: `${siteUrl()}/images/dhaka-bus-route-logo-transparent-blue-header.png`,
              sameAs: ["https://raihanmiraj.com/"],
            },
            {
              "@type": "FAQPage",
              mainEntity: seoFaqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }}
      />
    </div>
  );
}
