# SEO and indexing maintenance

Audit and fixes: 12 October 2026 (Asia/Dhaka).  
Follow-up: 26 October 2026 — see `SEO_AUDIT.md`, `SEO_IMPLEMENTATION.md`, `SEO_TEST_RESULTS.md`.

Preferred canonical origin: **https://www.dhakabusroutes.com** (confirmed live: robots Host, homepage canonical, apex→www 308).

## Canonical domain policy

- Public canonical origin: `https://www.dhakabusroutes.com`
- Production `SITE_URL` must be the www origin (apex values are normalized to www by `siteUrl()`).
- `metadataBase`, relative canonicals, Open Graph URLs, JSON-LD, sitemap, and robots derive from `siteUrl()`.
- `vercel.json` permanently redirects `dhakabusroutes.com/:path*` → `https://www.dhakabusroutes.com/:path*`.

## Resolved findings

- Three existing Unicode bus URLs returned HTTP 404 because encoded dynamic params were compared to decoded dataset slugs. Public bus, stop, journey, blog, taxonomy and author lookups now safely decode one path segment. Unknown or malformed slugs still return 404; existing URLs are preserved.
- Multiple Alif, BRTC and other bus variants shared titles/descriptions. Bus metadata now distinguishes the source-listed start/end stops. Stop and journey descriptions include their own route coverage.
- Sitemap generation used the request time as the modification date of nine top-level pages. These unverifiable timestamps are omitted. Published CMS posts retain their editorial modification dates.
- The static guide now shares its actual image and editorial dates with the sitemap. Its slug cannot produce a duplicate sitemap entry if a CMS record uses it. Sitemap URLs use URL serialization, including percent encoding for Unicode paths.
- Indexable pagination uses normalized page-number canonicals and distinct page titles. Invalid page numbers remain 404, and page one canonicals point to the main archive.
- Stop pages show bus endpoints and adjacent source-listed stops, adding useful route-specific detail and internal links without claiming verified locations or reverse operation.
- Author pages with empty biographies use a descriptive article-archive introduction and meta description.
- Blog Open Graph descriptions fall back to the excerpt when no SEO description is set.
- 26 Oct 2026: Bengali schedule wording fixed; SearchAction removed; OG siteName/image alt; journey/bus/stop internal links; apex→www redirect in repo; content accuracy on data-sources GPS.

## Validation

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`: see `SEO_TEST_RESULTS.md`.
- Local smoke checks covered titles, descriptions, canonicals, robots, H1, OG/Twitter, JSON-LD, sitemap, and 404 behavior.

## Search Console follow-up

1. Keep `SITE_URL=https://www.dhakabusroutes.com` in production. Prefer Domain property or HTTPS www URL-prefix property.
2. Submit `https://www.dhakabusroutes.com/sitemap.xml`.
3. Inspect representative www URLs; compare declared vs Google-selected canonical.
4. Request indexing sparingly for important updated URLs.
5. Monitor Page indexing for soft 404s, duplicates, and “Crawled - currently not indexed”.
6. Use Search Console Core Web Vitals for field performance.

Reference: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
