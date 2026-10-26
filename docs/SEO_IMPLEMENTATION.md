# SEO Implementation — 26 October 2026

Changes implement the audit in `SEO_AUDIT.md`. Preferred origin: **https://dhakabusroutes.com** (non-www).

## Code changes

### Metadata & social (`lib/seo.tsx`, `app/layout.tsx`, `lib/blog.ts`)

- Default OG/Twitter image object with width, height, and alt
- `openGraph.siteName` / `locale` on shared helper and root layout defaults
- Blog articles pass image alt into OG/Twitter; publisher Organization on BlogPosting
- Featured Bangla guide: siteName, image alt, publisher, non-www absolute source link

### Titles & descriptions

| Template | Pattern |
| --- | --- |
| Home | Absolute: `Dhaka Bus Route Finder — Search Local Bus Routes & Stops` |
| Bus | `[Name] — [Start] to [End]: Route, Stops & Map` |
| Stop | `[Stop] — Buses & Routes` |
| Journey | `[Origin] to [Destination] — Bus Routes` |
| Directories | Richer counts / intent copy |

### Content & schema (`app/page.tsx`, `app/data-sources/page.tsx`)

- Bengali hero: schedules wording removed
- Data sources: GPS optional Current Location wording aligned with Privacy
- Removed `SearchAction` (targets noindex query URLs)
- Added `Organization` + kept `WebSite` / accurate `FAQPage`

### Internal linking

- Journey pages: breadcrumb names, stop links, bus links, distinctive intro from match counts
- Bus pages: related curated journey links when the bus serves those pairs
- Stop pages: curated journeys involving the stop
- `StopList` stop names link to `/stops/[slug]` via lightweight `lib/slug.ts`

### Canonical / redirects / config

- `CANONICAL_ORIGIN = https://dhakabusroutes.com`
- `siteUrl()` rejects `www.dhakabusroutes.com` as `SITE_URL`
- `.env.example` uses non-www
- `vercel.json`: permanent redirect www → apex (path/query preserved)
- Absolute links/docs/examples updated off www

### Other

- `app/not-found.tsx`: `noindex` metadata + crawlable recovery links
- About title uses `absolute` to avoid “About … | Dhaka Bus Routes” duplication

## Files touched

`lib/seo.tsx`, `lib/config.ts`, `lib/slug.ts` (new), `lib/routes.ts`, `lib/blog.ts`, `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`, `app/about/page.tsx`, `app/buses/[slug]/page.tsx`, `app/buses/page.tsx`, `app/stops/[slug]/page.tsx`, `app/stops/page.tsx`, `app/routes/[slug]/page.tsx`, `app/routes/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/blog/dhaka-bus-travel-guide-2026/page.tsx`, `app/data-sources/page.tsx`, `components/ui.tsx`, `components/api-keys-panel.tsx`, `vercel.json`, `.env.example`, `README.md`, `tests/seo.test.ts`, `tests/geolocation.test.ts`, `docs/SEO_*.md`, `docs/seo-indexing.md`, `docs/IMPLEMENTATION.md`, `docs/ADMIN_API.md`

## Production configuration (owner)

1. Set `SITE_URL=https://dhakabusroutes.com` in Vercel env  
2. Set **apex** as primary domain; www must redirect to apex (align with `vercel.json`)  
3. Deploy so `vercel.json` www→apex redirect is live  
4. Recheck:

```bash
curl -sI http://dhakabusroutes.com/
curl -sI https://dhakabusroutes.com/
curl -sI https://www.dhakabusroutes.com/
curl -sI http://www.dhakabusroutes.com/
curl -sI https://dhakabusroutes.com/buses/achim-paribahan-1
curl -sI https://www.dhakabusroutes.com/buses/achim-paribahan-1
```

Expect canonical HTTPS apex **200**; www and bare HTTP permanently redirect to `https://dhakabusroutes.com/...` (TLS hop may precede host hop for HTTP).

## Google Search Console

1. Verify Domain property `dhakabusroutes.com`  
2. Submit `https://dhakabusroutes.com/sitemap.xml`  
3. Inspect representative apex URLs; compare declared vs Google-selected canonical  
4. Monitor indexing / redirect reports during the www→apex transition  

Canonicalization is a signal, not a guaranteed display-URL instruction.

## Intentionally not changed

- Route-search algorithm / dataset  
- Visual design system  
- Slug patterns / URL structure  
- FAQ rich-result chasing beyond accurate on-page FAQ schema  
- Fabricated fares, timetables, or verification dates  
