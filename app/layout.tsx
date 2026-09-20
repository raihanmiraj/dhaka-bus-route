import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { siteUrl } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Dhaka Bus Routes", template: "%s | Dhaka Bus Routes" },
  description: "Find listed Dhaka bus routes by boarding stop and destination.",
  verification: { google: "PHLU7GM99zhqx63oN5oeEJPoexoPvkDdGMbpL3un1V4" },
  icons: { icon: "/images/favicon-transparent-blue-header.ico" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" aria-label="Dhaka Bus Routes home">
              <Image
                src="/images/dhaka-bus-route-logo-transparent-blue-header.svg"
                alt="Dhaka Bus Routes"
                width={280}
                height={100}
                priority
              />
            </Link>
            <nav aria-label="Main">
              {["Routes", "Buses", "Stops", "Blog", "About"].map((x) => (
                <Link key={x} href={`/${x.toLowerCase()}`}>
                  {x}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" className="wrap">
          {children}
        </main>
        <footer className="site-footer">
          <div className="wrap">
            <strong>Dhaka Bus Routes</strong>
            <p>
              Plan your journey. Confirm boarding and service details locally.
            </p>
            <nav aria-label="Footer">
              <Link href="/data-sources">Data & sources</Link>
              <Link href="/report-route">Report a correction</Link>
              <Link href="/feed.xml">RSS</Link>
              <Link href="/admin">Editorial sign in</Link>
            </nav>
          </div>
        </footer>
        <GoogleAnalytics gaId="G-JJNBD39SEE" />
      </body>
    </html>
  );
}
