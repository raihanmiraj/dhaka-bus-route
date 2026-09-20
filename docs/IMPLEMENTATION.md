# Implementation checklist

## Plan

1. Preserve API/data; repair route resolution; build accessible public directories and design tokens.
2. Add validated pooled MongoDB persistence, Better Auth, roles and setup/index CLI.
3. Implement isolated working drafts/published snapshots, revisions, Editor.js, GridFS, taxonomy and moderation.
4. Implement SEO/feed/sitemap and run unit, database, browser, accessibility and production checks.

## Initial inspection

- Next 15.4.10 / React 19.1.0; Tailwind 4; no repository AGENTS.md or detailed audit found.
- Flutter hard-codes the existing Vercel API URL. API remains unchanged; no host redirect added.
- Reproduced ASCII normalization stripping `মিরপুর ১০` and `Mirpur 1` matching `Mirpur 10`.
- Confirmed exact suggestions excluded, reverse order assumed, segment preview starts at operator origin, fixed cap and stale swaps.
- Existing dataset is 230,708 bytes of TypeScript; search will run server-side, with small suggestion responses.
- No redirect configuration exists in next.config.ts. Live checks later confirmed apex→www; no application-level redirect was added.
- No production environment values inspected. Local isolated MongoDB is available for testing.

## Progress

- [x] Repository and API inspection; bug reproduction.
- [x] Public route search and directories.
- [x] Database, authentication and permission checks.
- [x] CMS lifecycle, editor, taxonomy and media.
- [x] SEO, RSS, corrections and analytics.
- [x] Tests, production build and browser checks.
- [x] Setup, rollback and owner checklist.

No deployment or production migration is authorized.

## Delivered and verified (2026-09-17)

- [x] Public route search, English/Bangla normalization, exact suggestions, numbered-stop separation, disambiguation, same-stop rejection, source-order segments, result refresh and load-more.
- [x] Bus/stop/curated-journey directories, source transparency, accessible tokens/components and preserved branding. Raw 184-route data and Flutter API source are unchanged.
- [x] 317 unique stop identities from 320 raw spellings: only `Asad gate`, `Ring road`, and `Sony CInema Hall` casing variants were normalized to their correctly capitalized counterparts. Nearby distinct places remain separate.
- [x] Pooled/retryable server-only MongoDB, schema validation, indexes and transaction-backed editorial writes.
- [x] Better Auth, persistent sessions, disabled public signup, admin/editor permissions, hidden-password CLI, origin checks and durable throttles.
- [x] Working drafts/published snapshots, optimistic saves, autosave status, unsaved warning/export, preview, duplicate, publish/update/unpublish/archive and revision restore.
- [x] Editor.js paragraphs/H2–H4/nested lists/quotes/images/tables/delimiters, inline sanitization and server rendering. Stable block-ID heading anchors and matching TOC.
- [x] Taxonomy CRUD/multi-select/primary category, SEO controls, source references, real author profiles and safe contextual route picker.
- [x] GridFS upload adapter, signature/size/pixel validation, safe re-encoding, private draft assets, media metadata editing, searchable paginated media library and reference-protected deletion.
- [x] Per-page metadata, canonical URLs, JSON-LD, published-only RSS/sitemap/archives/related posts, curated archive indexing and translation-group hreflang.
- [x] Persisted moderated corrections and privacy-conscious GA events. No automatic changes to public route records.
- [x] `.env.example`, index dry run/application scripts, account setup/recovery, storage/backup, deployment/rollback and owner documentation.

## Executed checks

| Check                               | Actual result                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                      | Passed, no warnings/errors in final run                                                                                 |
| `npm run typecheck`                 | Passed                                                                                                                  |
| `TEST_MONGODB_URI=… npm test`       | 23 tests passed across 3 files, using random local `dhaka_test_*` databases                                             |
| `npm run build`                     | Passed on Next.js 15.5.25                                                                                               |
| `npm run test:browser`              | 10 tests passed in Chrome against the production build; expanded CMS layout/correction test separately passed afterward |
| `npm run db:setup`                  | Dry run passed without writes                                                                                           |
| Index application                   | Passed on isolated browser-test database; production was not accessed                                                   |
| `npm audit`, `npm audit --omit=dev` | Zero known vulnerabilities after compatible transitive patches                                                          |
| Legacy source diff                  | No changes to `app/api/bus-route/route.ts`, `server/`, or `flutterapp/`                                                 |
| `git diff --check`                  | Passed                                                                                                                  |

Browser coverage includes real Editor.js restoration and round-trip save of all supported blocks; multiple categories/tag/primary category; uploaded image; public snapshot isolation; publish/update/slug redirect/unpublish; stale-save 409; cross-origin 403; anonymous admin/preview/media denial; invalid SVG rejection; published media visibility; correction persistence/moderation; invalid routes/archives/translations; page-1 normalization and out-of-range pagination.

Homepage, editor and article layouts were checked at 360, 390, 768, 1024 and 1440px with no page-level horizontal overflow. Homepage keyboard/touch behavior passed. Desktop/mobile screenshots were visually reviewed. Axe found **0 homepage violations** for the WCAG 2 A/AA, 2.1 AA and 2.2 AA rule tags. This is a scoped automated check, not a full manual accessibility certification.

Published article text, headings, lists, tables, images, canonical and JSON-LD were checked through HTTP and in a JavaScript-disabled browser. Public loaded-script assertions exclude Editor.js. The build reports ~113 kB homepage first-load JS; an observed local browser run recorded 122,484 script transfer bytes, 6 ms TTFB and 51 ms DOMContentLoaded. These local figures are not production Core Web Vitals or Lighthouse scores.

## Live read-only hostname observations

- `https://dhakabusroutes.com/` → **308** to `https://www.dhakabusroutes.com/` → **200**.
- Apex `/api/bus-route?contract=probe` → **308**, preserving path and query.
- `https://dhakabusroute.vercel.app/api/bus-route` → **307** to the www API → **200**, JSON and CORS headers present.
- No hosting redirects were changed. Keep www in production `SITE_URL`; owner should recheck these behaviors after any approved deployment.

## Boundaries and remaining owner work

- [ ] Rotate the previously exposed database password; configure production secrets, a restricted database user and Atlas network access.
- [ ] Approve/run production index setup after backup, create real accounts, and test deployment-specific upload/request limits.
- [ ] Verify production Search Console property/token, submit sitemap and inspect representative published URLs.
- [ ] Check route accuracy/directions/aliases with reliable operational sources. Fares, schedules, coordinates and checked dates remain unknown.
- [ ] Run production/staging Core Web Vitals, full manual screen-reader/keyboard review, cross-browser checks and load/backup-recovery exercises. Only local Chrome measurements are recorded here.
- No production credentials were used, no production migration ran, no content was published to a live site, and no deployment occurred.
- No articles were automatically seeded or published; optional setup seeds only two noindex taxonomy examples.
- Scheduling is deliberately outside scope. Password recovery is owner-assisted through the CLI, not a nonfunctional email flow.
- Public image bytes are not reversible secrets. Private/no-store image responses trade CDN caching for immediate access checks. Deployment must enforce the documented body limits and trusted-proxy configuration.
- The CMS intentionally blocks destructive deletion of referenced terms/assets. Route corrections are reviewed in the CMS; applying a verified transport-data change remains an explicit source-controlled editorial action.

## Changed-file map

- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/ui.tsx`, `components/search.tsx`: public design and journey finding.
- `app/buses`, `app/stops`, `app/routes`, `app/about`, `app/data-sources`, `app/report-route`: crawlable directories and transparency.
- `lib/db.ts`, `lib/config.ts`, `lib/auth.ts`, `lib/cms.ts`, `lib/content.ts`, `lib/indexes.ts`: configuration, persistence, authorization, content lifecycle and validation.
- `app/admin`, `app/api/admin`, `components/editor-canvas.tsx`, `components/post-editor.tsx`, `components/admin-panels.tsx`: editorial UI and protected management endpoints.
- `lib/storage.ts`, `app/api/upload`, `app/media`: durable validated media.
- `app/blog`, `app/authors`, `lib/blog.ts`, `lib/seo.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/feed.xml`: public publishing and SEO.
- `tests`, `scripts`, `.env.example`, `README.md`, `docs`: tests, setup and handover.
- `package.json`, `package-lock.json`, `next.config.ts`, lint/test configs: compatible dependency/security updates and verification tooling.
- The supplied untracked `Archive.zip` was left intact.
