import Link from "next/link";
import { metadata as meta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";

export const metadata = meta(
  "Privacy Policy",
  "How Dhaka Bus Routes collects, uses, and protects information when you search routes, read articles, or submit corrections.",
  "/privacy",
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
          name: "Privacy Policy",
          url: `${base}/privacy`,
          dateModified: "2026-10-07",
          isPartOf: { "@type": "WebSite", name: "Dhaka Bus Routes", url: base },
        }}
      />
      <p className="eyebrow">Legal</p>
      <h1>Privacy Policy</h1>
      <p>Last updated: {updated}</p>
      <p>
        This Privacy Policy explains how{" "}
        <strong>Dhaka Bus Routes</strong> ({base}) handles information when you
        use the website. The service helps passengers explore source-listed bus
        routes, stops, curated journeys, and editorial articles about travel in
        Dhaka. It is not an official transport authority and does not provide
        live vehicle tracking.
      </p>

      <h2>Information we process</h2>
      <ul>
        <li>
          <strong>Route search activity.</strong> Search analytics may store
          selected stop IDs and aggregate result counts so we can improve
          suggestions and ranking. Do not treat search as a private travel log.
        </li>
        <li>
          <strong>Correction reports.</strong> When you{" "}
          <Link href="/report-route">report a route correction</Link>, we receive
          the text and any route identifiers you submit. Reports enter a private
          moderation queue and are not published automatically. Do not include
          personal contact details, national IDs, or private travel histories.
        </li>
        <li>
          <strong>Editorial accounts.</strong> Administrators who sign in to the
          CMS authenticate with credentials we store securely for access control.
          Public readers do not need an account.
        </li>
        <li>
          <strong>Analytics.</strong> The site uses Google Analytics to
          understand aggregate traffic (pages viewed, approximate location at a
          city or region level, device and browser type). It does not request
          precise GPS locations from your device for route search.
        </li>
        <li>
          <strong>Technical logs.</strong> Standard server and security logs may
          temporarily record IP addresses, user agents, and request paths to
          diagnose errors and abuse.
        </li>
      </ul>

      <h2>Cookies and similar technologies</h2>
      <p>
        Analytics and session cookies may be set by Google Analytics or by the
        editorial sign-in flow. You can control cookies through your browser
        settings. Blocking analytics cookies will not prevent route search from
        working.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>Operate and improve route search, listings, and articles</li>
        <li>Review and respond to correction reports</li>
        <li>Protect the service against spam and abuse</li>
        <li>Measure aggregate audience interest in pages and guides</li>
      </ul>
      <p>
        We do not sell personal information. We do not use correction submissions
        for advertising profiles.
      </p>

      <h2>Sharing</h2>
      <p>
        Limited data may be processed by infrastructure providers that host the
        database, application, and analytics (for example MongoDB Atlas,
        hosting/CDN providers, and Google Analytics). Those processors act under
        their own terms and only as needed to run the service.
      </p>

      <h2>Media and public content</h2>
      <p>
        Published articles, category and tag pages, and images attached to
        published posts are intended for public indexing. Unpublished drafts and
        unused media uploads remain private to editors.
      </p>

      <h2>Data retention</h2>
      <p>
        Aggregate analytics follow Google Analytics retention settings.
        Correction reports are kept only as long as needed for moderation and
        data quality. Security logs are rotated on a routine schedule.
      </p>

      <h2>Children</h2>
      <p>
        The site is a general passenger information tool. It is not directed at
        children under 13, and we do not knowingly collect personal information
        from children.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Use the site without creating an account</li>
        <li>Avoid submitting personal details in correction forms</li>
        <li>Disable analytics cookies in your browser if you prefer</li>
        <li>
          Contact the developer via{" "}
          <a
            href="https://raihanmiraj.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            raihanmiraj.com
          </a>{" "}
          for privacy questions about this project
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may update this policy as the product changes. The “Last updated”
        date at the top will change when we do. Continued use after an update
        means you accept the revised policy.
      </p>

      <h2>Related pages</h2>
      <p>
        See also the <Link href="/terms">Terms of Use</Link>,{" "}
        <Link href="/data-sources">Data & sources</Link>, and{" "}
        <Link href="/about">About</Link> pages.
      </p>
    </article>
  );
}
