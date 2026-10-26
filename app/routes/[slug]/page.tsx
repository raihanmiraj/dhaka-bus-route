import { curatedJourneys, journeys, resolveStop } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { RouteCard } from "@/components/ui";
import { notFound } from "next/navigation";
import Link from "next/link";
import { decodeSlug } from "@/lib/url";
async function get(p: Promise<{ slug: string }>) {
  const { slug } = await p;
  const decoded = decodeSlug(slug);
  const j = curatedJourneys.find((j) => j.slug === decoded);
  if (!j) notFound();
  return j;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const j = await get(params);
  const from = resolveStop(j.from).name;
  const to = resolveStop(j.to).name;
  const count = journeys(j.from, j.to).length;
  return meta(
    `${from} to ${to} — Bus Routes`,
    `Compare ${count} listed direct bus ${count === 1 ? "route" : "routes"} from ${from} to ${to} in Dhaka. View stops and route maps; confirm boarding and service locally.`,
    `/routes/${j.slug}`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const j = await get(params);
  const from = resolveStop(j.from);
  const to = resolveStop(j.to);
  const matches = journeys(j.from, j.to);
  const fewest = matches[0]?.segment.length;
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Routes", href: "/routes" },
          {
            name: `${from.name} to ${to.name}`,
            href: `/routes/${j.slug}`,
          },
        ]}
      />
      <h1>
        {from.name} to {to.name}
      </h1>
      <p>
        {matches.length} listed direct{" "}
        {matches.length === 1 ? "bus" : "buses"} serve {from.name} before{" "}
        {to.name}
        {fewest ? `, with as few as ${fewest} listed stops on the shortest match` : ""}
        . Ranked by listed stop count, not travel time. Confirm operation and
        boarding details locally.
      </p>
      <p>
        Board at{" "}
        <Link href={`/stops/${from.id}`}>{from.name}</Link> and alight at{" "}
        <Link href={`/stops/${to.id}`}>{to.name}</Link>. Open any bus below for
        the full stop sequence and map.
      </p>
      <div className="stack">
        {matches.map((x) => (
          <RouteCard key={x.bus.id} bus={x.bus} segment={x.segment} />
        ))}
      </div>
      <h2>Explore nearby</h2>
      <ul>
        <li>
          <Link href={`/stops/${from.id}`}>{from.name} stop page</Link>
        </li>
        <li>
          <Link href={`/stops/${to.id}`}>{to.name} stop page</Link>
        </li>
        <li>
          <Link href={`/?from=${encodeURIComponent(from.name)}&to=${encodeURIComponent(to.name)}#search`}>
            Run this search on the homepage
          </Link>
        </li>
        {matches.slice(0, 3).map((x) => (
          <li key={`bus-${x.bus.id}`}>
            <Link href={`/buses/${x.bus.slug}`}>{x.bus.bus}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
