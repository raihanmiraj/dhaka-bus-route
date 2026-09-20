import { stops, buses, slugify } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
async function get(p: Promise<{ slug: string }>) {
  const { slug } = await p;
  const s = stops.find((s) => s.id === slug);
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
    `Source-listed bus variants serving ${s.name}.`,
    `/stops/${s.id}`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = await get(params);
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
        Stop location and service status have not been independently verified.
      </p>
      <Link className="button" href={`/?from=${s.id}`}>
        Find a journey from here
      </Link>
      <h2>Listed buses</h2>
      <ul>
        {buses
          .filter((b) => b.routeStops.some((name) => slugify(name) === s.id))
          .map((b) => (
            <li key={b.id}>
              <Link href={`/buses/${b.slug}`}>{b.bus}</Link>
            </li>
          ))}
      </ul>
    </>
  );
}
