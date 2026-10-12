import { buses } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { BusDirectory } from "@/components/bus-directory";

export const metadata = meta(
  "Bus directory — Search Dhaka bus routes",
  "Search and browse source-listed Dhaka bus routes by bus name or stop.",
  "/buses",
);

export default function Page() {
  const items = buses.map((b) => ({
    id: b.id,
    slug: b.slug,
    bus: b.bus,
    routeStops: b.routeStops,
  }));
  return (
    <>
      <Breadcrumbs items={[{ name: "Buses", href: "/buses" }]} />
      <h1>Bus directory</h1>
      <p>
        Search by bus name or stop, then open any route for the full stop list
        and map. Distinct source records are kept as separate variants.
      </p>
      <BusDirectory buses={items} />
    </>
  );
}
