import { curatedJourneys } from "@/lib/routes";
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
      <h1>Explore a journey</h1>
      <p>Source-listed connections, awaiting operational verification.</p>
      <div className="grid">
        {curatedJourneys.map((j) => (
          <Link className="card" key={j.slug} href={`/routes/${j.slug}`}>
            {j.slug.replaceAll("-", " ")}
          </Link>
        ))}
      </div>
    </>
  );
}
