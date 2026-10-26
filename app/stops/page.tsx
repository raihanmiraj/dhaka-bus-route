import { stops } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import Link from "next/link";
export const metadata = meta(
  "Bus stops — Dhaka boarding points",
  `Browse ${stops.length} boarding stops from the Dhaka route dataset. Open a stop to see which listed buses call there.`,
  "/stops",
);
export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Stops", href: "/stops" }]} />
      <h1>Find a stop</h1>
      <p>Nearby stops remain separate. Choose the numbered stop you need.</p>
      <div className="grid">
        {stops.map((s) => (
          <Link className="card" href={`/stops/${s.id}`} key={s.id}>
            {s.name}
          </Link>
        ))}
      </div>
    </>
  );
}
