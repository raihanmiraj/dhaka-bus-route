import { buses } from "@/lib/routes";
import { CorrectionForm } from "@/components/correction-form";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Report a route correction",
  "Help improve route information with a sourced correction.",
  "/report-route",
  false,
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ route?: string }>;
}) {
  return (
    <>
      <h1>Report a correction</h1>
      <p>
        Reports are moderated. Please do not include private contact details or
        personal travel histories.
      </p>
      <CorrectionForm
        routes={buses.map((b) => ({ id: b.id, name: b.bus }))}
        selected={(await searchParams).route ?? ""}
      />
    </>
  );
}
