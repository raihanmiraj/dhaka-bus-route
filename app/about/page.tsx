import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "About",
  "How Dhaka Bus Routes helps passengers find source-listed bus connections.",
  "/about",
);
export default function Page() {
  return (
    <article className="prose">
      <h1>About Dhaka Bus Routes</h1>
      <p>
        This website helps passengers explore bus routes using a preserved
        collection of public route listings.
      </p>
      <p>
        It is not a live tracking service or an official transport authority. We
        show uncertainty rather than invent fares, arrival times or verification
        dates.
      </p>
      <p>
        <a href="/data-sources">Read about our sources</a> or{" "}
        <a href="/report-route">submit a correction</a>. Reports are reviewed
        before any transport information changes.
      </p>
    </article>
  );
}
