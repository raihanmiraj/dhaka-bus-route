import { buses } from "@/lib/routes";
import { metadata as meta, Breadcrumbs } from "@/lib/seo";
import { RouteCard, Pagination } from "@/components/ui";
import { pageNumber } from "@/lib/pagination";
import { notFound, redirect } from "next/navigation";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const p = await searchParams;
  return meta(
    "Bus directory",
    "Browse source-listed Dhaka bus routes and their stops.",
    `/buses${p.page && p.page !== "1" ? `?page=${p.page}` : ""}`,
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const q = await searchParams;
  if (q.page === "1") redirect("/buses");
  let page;
  try {
    page = pageNumber(q.page);
  } catch {
    notFound();
  }
  if ((page - 1) * 12 >= buses.length) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: "Buses", href: "/buses" }]} />
      <h1>Bus directory</h1>
      <p>
        Distinct source records are kept as separate variants. Service and
        verification status remain unconfirmed.
      </p>
      <div className="grid">
        {buses.slice((page - 1) * 12, page * 12).map((b) => (
          <RouteCard key={b.id} bus={b} />
        ))}
      </div>
      <Pagination
        page={page}
        total={Math.ceil(buses.length / 12)}
        base="/buses"
      />
    </>
  );
}
