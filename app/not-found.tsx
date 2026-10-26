import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>This address does not have available public content.</p>
      <p>
        <Link href="/">Find a bus route</Link>
        {" · "}
        <Link href="/buses">Bus directory</Link>
        {" · "}
        <Link href="/stops">Stops</Link>
      </p>
    </>
  );
}
