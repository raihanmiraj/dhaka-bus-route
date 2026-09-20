import type { Metadata } from "next";
import { siteUrl } from "./config";
export function metadata(
  title: string,
  description: string,
  path: string,
  index = true,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      images: ["/images/featured-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/featured-image.png"],
    },
  };
}
export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <a href="/">Home</a>
        {items.map((x) => (
          <span key={x.href}>
            {" "}
            / <a href={x.href}>{x.name}</a>
          </span>
        ))}
      </nav>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [{ name: "Home", href: "/" }, ...items].map(
            (x, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: x.name,
              item: siteUrl() + x.href,
            }),
          ),
        }}
      />
    </>
  );
}
