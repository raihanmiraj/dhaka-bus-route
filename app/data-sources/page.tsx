import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Data and sources",
  "Understand the origin and limitations of our route listings.",
  "/data-sources",
);
export default function Page() {
  return (
    <article className="prose">
      <h1>Data & sources</h1>
      <h2>Preserved public listings</h2>
      <p>
        The repository includes a structured dataset dated June 9, 2026. That is
        a compilation date, not evidence that any route was checked on that day.
        Individual bus pages link to the source references recorded in the
        dataset.
      </p>
      <h2>What remains unknown</h2>
      <p>
        Operating status, reverse operation, fares, timetables, coordinates and
        last verification dates are unknown. Stop order is used as listed;
        similarly named places are not automatically merged.
      </p>
      <h2>Corrections</h2>
      <p>
        <a href="/report-route">Send a route correction</a> with a source and
        the observed issue. Reports enter a private moderation queue and never
        automatically change the directory.
      </p>
      <h2>Privacy</h2>
      <p>
        Search analytics use selected stop IDs and aggregate result counts. Do
        not submit personal travel histories or private contact details in
        correction text. This site uses Google Analytics; it does not request
        precise GPS locations. Full details are in the{" "}
        <a href="/privacy">Privacy Policy</a> and{" "}
        <a href="/terms">Terms of Use</a>.
      </p>
    </article>
  );
}
