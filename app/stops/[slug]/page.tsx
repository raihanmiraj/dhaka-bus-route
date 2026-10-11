import { stops, buses, slugify } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { decodeSlug } from "@/lib/url";
async function get(p: Promise<{ slug: string }>) {
  const { slug } = await p;
  const decoded = decodeSlug(slug);
  const s = stops.find((s) => s.id === decoded);
  if (!s) notFound();
  return s;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = await get(params);
  return meta(
    `${s.name} bus stop`,
    `Find ${buses.filter((b) => b.routeStops.some((name) => slugify(name) === s.id)).length} listed bus routes serving ${s.name} in Dhaka. Browse route stops and maps, and plan your journey from this stop.`,
    `/stops/${s.id}`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = await get(params);
  const serving = buses.filter((b) =>
    b.routeStops.some((name) => slugify(name) === s.id),
  );
  const adjacent = new Map<string, string>();
  for (const b of serving) {
    b.routeStops.forEach((name, i) => {
      if (slugify(name) !== s.id) return;
      for (const neighbour of [b.routeStops[i - 1], b.routeStops[i + 1]]) {
        if (neighbour && slugify(neighbour) !== s.id)
          adjacent.set(slugify(neighbour), neighbour);
      }
    });
  }
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Stops", href: "/stops" },
          { name: s.name, href: `/stops/${s.id}` },
        ]}
      />
      <h1>{s.name}</h1>
      <p>
        {s.name} appears in {serving.length} listed bus routes. Open a bus below
        to see its full stop sequence and approximate route map. Stop location
        and service status have not been independently verified.
      </p>
      <Link className="button" href={`/?from=${s.id}`}>
        Find a journey from here
      </Link>
      <h2>Listed buses</h2>
      <ul>
        {serving.map((b) => (
          <li key={b.id}>
            <Link href={`/buses/${b.slug}`}>{b.bus}</Link>
            <p className="muted">
              {b.routeStops[0]} → {b.routeStops.at(-1)} · {b.routeStops.length}{" "}
              listed stops
            </p>
          </li>
        ))}
      </ul>
      {adjacent.size > 0 && (
        <>
          <h2>Adjacent stops in listed routes</h2>
          <p>
            These stops appear immediately before or after {s.name} in the
            source records. This does not confirm walking distance or service in
            the reverse direction.
          </p>
          <ul>
            {[...adjacent].map(([id, name]) => (
              <li key={id}>
                <Link href={`/stops/${id}`}>{name}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
