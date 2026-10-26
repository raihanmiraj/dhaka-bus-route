# SEO Test Results — 26 October 2026

## Automated project checks

| Check | Command | Result |
| --- | --- | --- |
| Unit tests | `npm test` | **PASS** — 53 passed, 13 skipped (DB integration) |
| Typecheck | `npm run typecheck` | **PASS** |
| Lint | `npm run lint` | **PASS** |
| Production build | `npm run build` | **PASS** (Next.js 15.5.25) |

New/updated unit coverage in `tests/seo.test.ts`:

- OG siteName / image alt defaults  
- Bus / stop / journey title patterns + uniqueness  
- Shared `lib/slug` helpers  
- www `CANONICAL_ORIGIN` + apex→www normalization  
- Existing sitemap date / uniqueness / Unicode slug regressions  

## Local production-server SEO smoke (`npm start -p 3456`)

Representative URLs checked against the built app (local `SITE_URL=http://localhost:3000`, so absolute hosts are localhost — **production uses www** via env).

| URL | Status | Title | Description | Canonical | Robots | H1=1 | OG+Twitter | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | PASS | PASS | PASS | index | PASS | PASS + site_name + image:alt | Org+WebSite; no SearchAction; BN hero fixed |
| `/?from=…&to=…` | 200 | PASS | PASS | self `/` | **noindex** | PASS | PASS | Search URLs not indexed |
| `/buses/achim-paribahan-1` | 200 | PASS (new pattern) | PASS | PASS | index | PASS | PASS | BreadcrumbList |
| `/stops/mirpur-10` | 200 | PASS | PASS | PASS | index | PASS | PASS | Curated journey links |
| `/routes/mirpur-10-to-farmgate` | 200 | PASS | PASS | PASS | index | PASS | PASS | Stop links + proper breadcrumb names |
| `/blog/dhaka-bus-travel-guide-2026` | 200 | PASS | PASS | PASS | index | PASS | PASS + image alt | BlogPosting + publisher |
| `/buses`, `/stops`, `/routes`, `/blog`, `/about`, `/privacy`, `/terms`, `/data-sources` | 200 | PASS | PASS | PASS | index | PASS | PASS | Directories/legal |
| `/report-route` | 200 | PASS | PASS | PASS | **noindex** | PASS | PASS | Intentionally unlisted |
| `/buses/not-a-real-bus-xyz` | **404** | — | — | — | — | — | — | Hard 404 |
| `/robots.txt` | 200 | — | — | — | — | — | — | Disallows admin/api; sitemap ref |
| `/sitemap.xml` | 200 | — | — | — | — | — | — | 544 unique URLs; no private paths |

Content assertions (local build):

- PASS — Bengali hero no longer mentions schedules  
- PASS — SearchAction removed  
- PASS — Organization schema present  
- PASS — data-sources GPS wording aligned  
- PASS — journey breadcrumb uses “Mirpur 10 to Farmgate”  
- PASS — `/buses/hazi-transport-80` links related curated journey  

## Live production (pre-deploy baseline)

Captured 26 Oct 2026 before this deploy:

- Robots `Host` / `Sitemap` already on **www**  
- Canonical homepage: `https://www.dhakabusroutes.com`  
- Redirect: `https://dhakabusroutes.com` → **308** → www  
- OG homepage preview already functional; alt/site_name missing (fixed in code, pending deploy)

## Not executed / blocked

| Item | Reason |
| --- | --- |
| Playwright browser suite | Optional; not required for this SEO pass (unit + local HTTP smoke done) |
| Google Search Console reports | No account access |
| Rich Results Test / URL Inspection | Requires post-deploy manual run |
| Field Core Web Vitals | CrUX / GSC only |
| Post-deploy redirect verification with new `vercel.json` | Needs authorized production deploy |

## Post-deploy checklist (manual)

1. Confirm production env `SITE_URL=https://www.dhakabusroutes.com`  
2. Curl redirect matrix (apex/www × http/https)  
3. Submit `https://www.dhakabusroutes.com/sitemap.xml` in Search Console  
4. Inspect home, `/buses/achim-paribahan-1`, `/stops/mirpur-10`, `/routes/mirpur-10-to-farmgate`, featured blog  
5. Validate JSON-LD with Rich Results Test / Schema validator  
6. Re-check Facebook/LinkedIn OG debugger for `og:site_name` and image alt  
7. Monitor indexing for soft 404s and canonical conflicts  

No ranking guarantees. Sitemap inclusion ≠ indexing.
