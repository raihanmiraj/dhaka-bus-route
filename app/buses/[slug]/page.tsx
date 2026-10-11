import { buses, slugify } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RouteOpened } from "@/components/tracking";
import { RouteMap } from "@/components/route-map";
import { decodeSlug } from "@/lib/url";

async function get(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const decoded = decodeSlug(slug);
  const b = buses.find((b) => b.slug === decoded);
  if (!b) notFound();
  return b;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const b = await get(params);
  return meta(
    `${b.bus.split(" Bus Route")[0].split(" (")[0]}: ${b.routeStops[0]} to ${b.routeStops.at(-1)}`,
    `${b.bus}: ${b.routeStops[0]} to ${b.routeStops.at(-1)}, with ${b.routeStops.length} listed stops. View the stop sequence and map; confirm service locally.`,
    `/buses/${b.slug}`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const b = await get(params);
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Buses", href: "/buses" },
          { name: b.bus, href: `/buses/${b.slug}` },
        ]}
      />
      <p className="eyebrow">Bus details</p>
      <h1>{b.bus}</h1>
      <RouteOpened id={String(b.id)} />
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="badge">Variant {b.id}</span>
        <span className="badge">Verification pending</span>
        <span className="badge">{b.routeStops.length} stops</span>
        {b.service ? <span className="badge">{b.service}</span> : null}
      </div>
      <p>
        Stops below follow source order. Reverse operation, fares, timetables
        and operating status are unverified. Use the map for an approximate
        geographic overview.
      </p>

      <RouteMap stops={b.routeStops} title={b.bus} />

      <h2>Stops along this route</h2>
      <ol className="bus-stop-list">
        {b.routeStops.map((s, i) => (
          <li key={`${s}-${i}`}>
            <span className="stop-index">{i + 1}</span>
            <Link href={`/stops/${slugify(s)}`}>{s}</Link>
          </li>
        ))}
      </ol>

      <h2>Source references</h2>
      <ul>
        {b.sources
          ?.filter((s) => s.startsWith("https://"))
          .map((s) => (
            <li key={s}>
              <a href={s} rel="nofollow noreferrer">
                {new URL(s).hostname}
              </a>
            </li>
          ))}
      </ul>
      <p>
        <Link href={`/report-route?route=${b.id}`}>
          Report a correction for this route
        </Link>
      </p>
    </>
  );
}
