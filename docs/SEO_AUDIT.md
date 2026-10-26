# SEO Audit — Dhaka Bus Routes

**Date:** 26 October 2026 (Asia/Dhaka)  
**Site:** https://dhakabusroutes.com/  
**Stack:** Next.js 15.5 App Router, React 19, MongoDB CMS, Vercel  

Preferred canonical origin: `https://dhakabusroutes.com` (non-www). Live production as of the pre-deploy check still redirected apex→www; repository + Vercel primary-domain changes flip that after deploy.

## Environment snapshot

| Item | Finding |
| --- | --- |
| Rendering | Mixed static + dynamic RSC; bus/stop/journey pages SSR with streamed metadata |
| Metadata API | `lib/seo.tsx` + per-route `generateMetadata` / static `metadata` |
| Sitemap / robots | `app/sitemap.ts`, `app/robots.ts` |
| Admin indexing | `X-Robots-Tag: noindex` + robots.txt disallow |
| Target redirect chain | `http://www` / `https://www` / `http://apex` → `https://dhakabusroutes.com` (path/query preserved) |

Streaming metadata (title/meta in body for dynamic routes) is expected for Next.js 15 and is **not** treated as an SEO defect for Googlebot.

---

## Confirmed bugs (fixed in this pass)

| # | Issue | Evidence | Priority |
| --- | --- | --- | --- |
| 1 | Bengali homepage hero claimed schedules (`সময়সূচী`) while FAQ denies live times | Production HTML vs `seoFaqs` | High |
| 2 | `/data-sources` claimed the site does not request GPS; Current Location uses optional GPS | Page copy vs Privacy / Search UI | High |
| 3 | Homepage `SearchAction` targeted `/?from=&to=` URLs that are `noindex` | JSON-LD vs `generateMetadata` robots | High |
| 4 | Missing `og:site_name`, `og:image:alt`, Twitter image alt | Live head tags | Medium |
| 5 | Journey breadcrumbs used slug text (`mirpur 10 to farmgate`) | Live HTML | Medium |
| 6 | Journey pages shared near-identical thin intros | Template copy | Medium |
| 7 | Weak contextual internal links (journey stops unlinked; few bus↔journey links) | Templates | Medium |
| 8 | Canonical preference must be non-www; prior docs/live preferred www | Owner requirement 2026-10-26 | High |
| 9 | Hostname redirects must send www→apex (not apex→www) | `vercel.json` + Vercel primary domain | High |

## Confirmed healthy (no change required)

- Unique titles/descriptions for all 184 bus variants (prior fix)
- Self-referencing canonicals on indexable templates (resolve via `metadataBase` / `siteUrl()`)
- Query-string homepage searches are `noindex, follow`
- `/report-route` is `noindex`; excluded from sitemap
- Admin/`/api/` blocked in robots + headers
- Soft/hard 404 for unknown buses returns HTTP 404
- OG image `/images/featured-image.png` reachable (1672×941 PNG)
- Sitemap unique HTTPS apex URLs; no admin/report-route entries
- BlogPosting / BreadcrumbList / AboutPage schema present where expected
- Unicode bus slug decoding (prior fix)

## Potential improvements (not confirmed defects)

| Item | Notes |
| --- | --- |
| FAQPage rich results | Visible FAQ content is accurate; Google eligibility for FAQ rich results is limited. Schema retained as matching on-page content, not as a ranking tactic. |
| Only 2 curated journey URLs | Dataset supports more pairs via homepage search; expanding curated pages needs editorial choice, not automated thin pages. |
| Homepage `force-dynamic` removed | Metadata still varies with `searchParams`; caching behavior should be rechecked after deploy. |
| LCP / CWV field data | Requires Search Console / CrUX; lab-only measurements not claimed as field metrics. |
| HTTP→HTTPS hop | Vercel upgrades HTTP before host redirects; expect a possible TLS hop then www→apex. |

## Requires production / Search Console access

1. Submit / re-verify **non-www** sitemap after deploy  
2. URL Inspection + Google-selected canonical on apex URLs  
3. Page indexing / “Crawled – currently not indexed” review  
4. Core Web Vitals field report  
5. Rich Results Test on home, bus, stop, journey, blog  
6. Confirm production `SITE_URL=https://dhakabusroutes.com`  
7. Confirm Vercel domain primary = apex and both hostnames have certs  
8. Re-curl redirect matrix after deploy (see `SEO_IMPLEMENTATION.md`)

Do not invent indexing counts without Search Console.
