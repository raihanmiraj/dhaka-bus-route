import { curatedJourneys, resolveStop } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import Link from "next/link";
export const metadata = meta(
  "Journey routes",
  "A small selection of journeys supported by the current route dataset.",
  "/routes",
);
export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Routes", href: "/routes" }]} />
      <p className="eyebrow">Journeys</p>
      <h1>Explore a journey</h1>
      <p>Source-listed connections, awaiting operational verification.</p>
      <div className="grid">
        {curatedJourneys.map((j) => (
          <Link className="card journey-chip" key={j.slug} href={`/routes/${j.slug}`}>
            <span className="badge">Direct match</span>
            <strong>
              {resolveStop(j.from).name} → {resolveStop(j.to).name}
            </strong>
            <span className="muted">Compare buses by stop count</span>
          </Link>
        ))}
      </div>
    </>
  );
}
