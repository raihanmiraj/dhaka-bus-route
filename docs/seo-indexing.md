# SEO and indexing maintenance

Audit and fixes: 12 October 2026 (Asia/Dhaka).

## Resolved findings

- Three existing Unicode bus URLs returned HTTP 404 because encoded dynamic params were compared to decoded dataset slugs. Public bus, stop, journey, blog, taxonomy and author lookups now safely decode one path segment. Unknown or malformed slugs still return 404; existing URLs are preserved.
- Multiple Alif, BRTC and other bus variants shared titles/descriptions. Bus metadata now distinguishes the source-listed start/end stops. Stop and journey descriptions include their own route coverage.
- Sitemap generation used the request time as the modification date of nine top-level pages. These unverifiable timestamps are omitted. Published CMS posts retain their editorial modification dates.
- The static guide now shares its actual image and editorial dates with the sitemap. Its slug cannot produce a duplicate sitemap entry if a CMS record uses it. Sitemap URLs use URL serialization, including percent encoding for Unicode paths.
- Indexable pagination uses normalized page-number canonicals and distinct page titles. Invalid page numbers remain 404, and page one canonicals point to the main archive.
- Stop pages show bus endpoints and adjacent source-listed stops, adding useful route-specific detail and internal links without claiming verified locations or reverse operation.
- Author pages with empty biographies use a descriptive article-archive introduction and meta description.
- Blog Open Graph descriptions fall back to the excerpt when no SEO description is set.

## Validation

- `npm test`: 27 passed; 13 database/server integration tests skipped because isolated local database credentials were not configured. Tests cover every bus/stop metadata lookup, encoded Unicode slugs, metadata uniqueness, broken internal stop references, pagination and sitemap dates/images.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed.
- HTTP checks against the local production build: 527 non-database public pages and bus pagination URLs returned 200, with a title, description, matching canonical, one H1 and no noindex. A nonexistent bus returned 404.
- The earlier live audit's tunnel/connection errors are not origin HTTP errors; they do not establish that Googlebot is blocked.

## Search Console follow-up

1. Keep `SITE_URL=https://www.dhakabusroutes.com` in production. Verify the domain property or the exact HTTPS www URL-prefix property.
2. Submit `https://www.dhakabusroutes.com/sitemap.xml` and check the Sitemaps report for successful processing.
3. Inspect the repaired bus URLs and representative bus, stop, journey and blog pages. Compare the declared canonical with Google's selected canonical and run the live test.
4. Request indexing for the three repaired URLs and important new/updated articles. Do not repeatedly request indexing for every dataset page.
5. Monitor Page indexing for server errors, soft 404s, duplicate canonical decisions and "Crawled - currently not indexed". Sitemap inclusion and valid metadata cannot guarantee indexing or ranking.
6. Maintain accurate routes, substantive unique article content, publication dates, author information and working images. Expand or consolidate pages only on verified data; similar stop spellings alone are not evidence that two stops are identical.
7. Use Search Console Core Web Vitals for actual field performance. A successful build or local response-time check is not a substitute for field metrics or Google's structured-data validation.

Reference: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
