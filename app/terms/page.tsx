import Link from "next/link";
import { metadata as meta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";

export const metadata = meta(
  "Terms of Use",
  "Terms for using Dhaka Bus Routes: informational listings only, no live tracking, and user responsibilities for corrections and content.",
  "/terms",
);

export default function Page() {
  const base = siteUrl();
  const updated = "7 October 2026";
  return (
    <article className="prose">
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Terms of Use",
          url: `${base}/terms`,
          dateModified: "2026-10-07",
          isPartOf: { "@type": "WebSite", name: "Dhaka Bus Routes", url: base },
        }}
      />
      <p className="eyebrow">Legal</p>
      <h1>Terms of Use</h1>
      <p>Last updated: {updated}</p>
      <p>
        Welcome to <strong>Dhaka Bus Routes</strong> ({base}). By accessing or
        using this website, you agree to these Terms of Use. If you do not agree,
        please do not use the service.
      </p>

      <h2>What this service is</h2>
      <p>
        Dhaka Bus Routes is an informational directory of source-listed bus
        routes, stops, curated journeys, and editorial articles for passengers
        in Dhaka. It is developed and maintained by{" "}
        <a
          href="https://raihanmiraj.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Raihan Miraj
        </a>
        .
      </p>
      <ul>
        <li>It is not an official transport authority or operator.</li>
        <li>It does not provide live bus tracking, arrival predictions, or fare quotes.</li>
        <li>
          Route data comes from preserved public listings; compilation dates are
          not verification dates. See{" "}
          <Link href="/data-sources">Data & sources</Link>.
        </li>
        <li>
          Operating status, reverse operation, timetables, exact stop
          coordinates, and last field-check dates may be unknown or approximate.
        </li>
      </ul>

      <h2>Your responsibilities</h2>
      <ul>
        <li>
          Confirm boarding points, service changes, and fares locally before you
          travel.
        </li>
        <li>
          Use the site lawfully. Do not attempt to disrupt, scrape abusively, or
          overload the service.
        </li>
        <li>
          When submitting a{" "}
          <Link href="/report-route">route correction</Link>, provide accurate,
          sourced information and do not include private personal data or
          harassment.
        </li>
        <li>
          Do not present the site as government or operator-endorsed guidance.
        </li>
      </ul>

      <h2>Editorial content and media</h2>
      <p>
        Blog articles, categories, tags, and uploaded images are managed through
        the editorial CMS. Published, indexable content may appear in{" "}
        <Link href="/sitemap.xml">sitemap.xml</Link> for search engines.
        Unpublished drafts remain private. You may not copy substantial editorial
        content for commercial reuse without permission.
      </p>

      <h2>User submissions</h2>
      <p>
        Correction reports are moderated and never automatically change the
        directory. By submitting a report, you grant us a non-exclusive license
        to use the information to evaluate and, if appropriate, update listings.
        We may decline or edit submissions that lack a usable source.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Dhaka Bus Routes name, logos, layout, and original editorial writing
        are protected as applicable. Third-party marks (bus operator names,
        place names) remain with their owners and are used only for
        identification. OpenStreetMap and other map views follow their own
        licenses where embedded.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        The service is provided “as is” and “as available.” We do not warrant
        that route listings are complete, current, or error-free. Use at your
        own risk for trip planning.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the developer and operators of
        Dhaka Bus Routes are not liable for indirect, incidental, or
        consequential damages arising from reliance on route information,
        downtime, or third-party services (including maps and analytics).
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle analytics, corrections, and technical data is described in
        the <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms as the project evolves. The “Last updated”
        date will change when we do. Questions about these terms can be directed
        through{" "}
        <a
          href="https://raihanmiraj.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          raihanmiraj.com
        </a>{" "}
        or via the <Link href="/about">About</Link> page.
      </p>
    </article>
  );
}
