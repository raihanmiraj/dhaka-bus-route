import Link from "next/link";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "About",
  "How Dhaka Bus Routes helps passengers find source-listed bus connections.",
  "/about",
);
export default function Page() {
  return (
    <article className="prose">
      <p className="eyebrow">About</p>
      <h1>About Dhaka Bus Routes</h1>
      <p>
        Dhaka Bus Routes helps passengers explore bus connections using a
        preserved collection of public route listings — from boarding stop to
        destination, with stop lists and approximate OpenStreetMap views.
      </p>
      <p>
        It is not a live tracking service or an official transport authority. We
        show uncertainty rather than invent fares, arrival times or verification
        dates.
      </p>
      <p>
        On mobile, the app-style navigation keeps Buses, Routes, Search, Blog and
        About one tap away so you can plan a trip quickly.
      </p>
      <p>
        <Link href="/data-sources">Read about our sources</Link> or{" "}
        <Link href="/report-route">submit a correction</Link>. Reports are
        reviewed before any transport information changes.
      </p>
    </article>
  );
}
