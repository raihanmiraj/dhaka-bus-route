import Image from "next/image";
import Link from "next/link";
import { metadata as meta, JsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/config";

export const metadata = meta(
  "About",
  "Learn about Dhaka Bus Routes, built by Raihan Miraj to help passengers find source-listed bus connections across Dhaka.",
  "/about",
);

export default function Page() {
  const base = siteUrl();
  return (
    <article className="prose">
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Dhaka Bus Routes",
          url: `${base}/about`,
          description:
            "How Dhaka Bus Routes helps passengers find source-listed bus connections.",
          mainEntity: {
            "@type": "Person",
            name: "Raihan Miraj",
            url: "https://raihanmiraj.com/",
            image: `${base}/images/me.jpg`,
            jobTitle: "Developer",
          },
        }}
      />
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

      <h2>Developer</h2>
      <figure className="about-developer">
        <Image
          src="/images/me.jpg"
          alt="Raihan Miraj, developer of Dhaka Bus Routes"
          width={160}
          height={160}
          className="about-avatar"
        />
        <figcaption>
          <strong>Raihan Miraj</strong>
          <br />
          Built and maintained by{" "}
          <a
            href="https://raihanmiraj.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Raihan Miraj
          </a>
          . Visit{" "}
          <a
            href="https://raihanmiraj.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            raihanmiraj.com
          </a>{" "}
          for more work and projects.
        </figcaption>
      </figure>

      <p>
        On mobile, the app-style navigation keeps Buses, Routes, Search, Blog and
        About one tap away so you can plan a trip quickly.
      </p>
      <p>
        <Link href="/data-sources">Read about our sources</Link>, review the{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/terms">Terms of Use</Link>, or{" "}
        <Link href="/report-route">submit a correction</Link>. Reports are
        reviewed before any transport information changes.
      </p>
    </article>
  );
}
