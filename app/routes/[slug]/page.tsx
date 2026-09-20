import { curatedJourneys, journeys, resolveStop } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { RouteCard } from "@/components/ui";
import { notFound } from "next/navigation";
async function get(p: Promise<{ slug: string }>) {
  const { slug } = await p;
  const j = curatedJourneys.find((j) => j.slug === slug);
  if (!j) notFound();
  return j;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const j = await get(params);
  return meta(
    `${resolveStop(j.from).name} to ${resolveStop(j.to).name}`,
    "Compare source-listed direct routes by stop count.",
    `/routes/${j.slug}`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const j = await get(params);
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Routes", href: "/routes" },
          { name: j.slug.replaceAll("-", " "), href: `/routes/${j.slug}` },
        ]}
      />
      <h1>
        {resolveStop(j.from).name} to {resolveStop(j.to).name}
      </h1>
      <p>
        Ranked by listed stop count, not travel time. Confirm operation and
        boarding details locally.
      </p>
      <div className="stack">
        {journeys(j.from, j.to).map((x) => (
          <RouteCard key={x.bus.id} bus={x.bus} segment={x.segment} />
        ))}
      </div>
    </>
  );
}
