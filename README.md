# Dhaka Bus Routes

Next.js App Router application with a source-preserving bus finder, server-rendered directories and articles, and a MongoDB-backed Editor.js editorial workspace. Flutter and `GET /api/bus-route` retain their existing contract.

## Local setup

Use Node.js 24 LTS and a MongoDB replica set (Atlas or a local replica set). Transactions are required for publication, revisions and safe reference changes.

1. `npm ci`
2. Copy `.env.example` to ignored `.env.local`, then replace every placeholder. For local development use `SITE_URL="http://localhost:3000"` and a separate development database.
3. Generate `AUTH_SECRET` with `openssl rand -base64 48`. Never use an example or test secret in production.
4. `npm run db:setup` prints a dry run. After confirming the target database, `npm run db:setup -- --apply --seed` creates indexes and two noindex taxonomy examples. It does not create or publish articles.
5. `npm run create-admin` prompts for email, real author name, slug and a hidden password. No public registration or default credentials exist. Use `-- --editor` for an editor account. The owner verifies the supplied email/person out of band.
6. `npm run dev`, then visit `/admin/login`.

Missing credentials fail explicitly. Route search remains independent of the CMS database. Blog pages show an unavailable state when storage is unavailable; they do not simulate empty content.

## Editorial workflow

- Editors create, save, preview and restore working drafts. Administrators publish, unpublish, archive, manage taxonomy and privileged settings.
- Draft saves increment an optimistic version. A stale tab receives HTTP 409 and retains local text; download the local draft before reloading.
- Publishing copies validated working content to a separate published snapshot. Public HTML, metadata, taxonomy results, counts, RSS, sitemaps and related articles read snapshots only.
- Restoring a revision creates a working draft. Publication timestamps and revision history are preserved.
- A published slug is reserved permanently to its post. Old slug redirects resolve directly to that post's current published slug, avoiding chains. Unpublished targets do not redirect to unavailable articles.
- Categories and tags cannot be deleted while referenced by any current working or retained published snapshot. Reassign and republish first.
- An article needs a real author profile, primary category, excerpt, content, meta description and featured image alt text. All block types, taxonomy/media/internal links and slugs are checked server-side.
- Heading levels are H2–H4; the article title is H1. Supported blocks: paragraphs, nested ordered/unordered lists, quotes, images, tables and delimiters. Inline emphasis and safe links are sanitized on both save and render.
- Published pages with Bangla content use `lang="bn"` on their article. Site navigation remains English. Reciprocal hreflang appears only for existing published translation-group peers; no synthetic `/bn` duplicates exist.

## Media

GridFS is the default replaceable storage adapter (`lib/storage.ts`). Upload JPEG, PNG or WebP up to 3 MB. Signatures are inspected; decoded images are limited to 24 million pixels and re-encoded to WebP at a maximum 2400px dimension, removing metadata. SVG, HTML, AVIF and remote fetch uploads are rejected. The body-size limit must also be enforced at the reverse proxy/platform before multipart parsing.

Media metadata and GridFS bytes are separate from article documents. Private assets require a session. Public access is determined by references in a currently published snapshot. Responses intentionally use `private, no-store` to avoid stale public CDN copies after unpublication; public images, once downloaded, cannot become secrets. Native image elements avoid a separate optimization cache that could bypass this check. Deletion is administrator-only and blocked by references in drafts, snapshots or revisions.

Back up GridFS `fs.files` and `fs.chunks` with the same snapshot as content, revisions, media metadata and auth collections. Monitor Atlas quotas and upload volume. Storage is not unlimited. A future object-storage adapter can replace GridFS behind the storage interface.

## Security and operations

- Rotate the previously shared database password before configuring production. Do not reuse or paste it into source, issue trackers or logs.
- Give the application database user `readWrite` only on `dhakabusroutes`. Use separate owner/operator credentials for backup administration. Do not grant cluster administration to the application.
- Atlas Network Access: allow only the hosting egress addresses or use private networking. Do not leave `0.0.0.0/0` enabled. For development, add a short-lived entry for your current IP.
- All admin pages and endpoints authorize on the server. Better Auth handles HttpOnly sessions, expiration, logout, password hashing and CSRF. Mutations also require the configured exact Origin. Login throttling is stored in MongoDB; correction counters are atomic and durable.
- Your trusted proxy must overwrite forwarding headers, reject spoofed client IP headers and enforce request body/rate limits. Add perimeter throttling for volumetric protection. Do not directly expose the origin behind an untrusted forwarding proxy.
- Password recovery is owner-assisted: `npm run create-admin -- --reset-password` with the existing email and a new hidden password. Existing sessions are revoked. No nonfunctional email-reset control is shown.
- CMS reads are dynamic and not placed in a shared Next data cache. Mutations explicitly invalidate public router paths, RSS and sitemap artifacts. Preview/admin responses use no-store and noindex.
- The supplied canonical preference is `https://www.dhakabusroutes.com`. No automatic hostname redirect is installed because live read-only checks confirmed the existing hosting redirects: apex→www (308), with path/query preservation; the legacy Vercel API redirects to the www API (307→200). Recheck these behaviors after deployment. Preserve paths/query strings and keep the legacy Flutter API available with CORS.

## Checks

```
npm run lint
npm run typecheck
npm test
TEST_MONGODB_URI='mongodb://127.0.0.1:27028/?replicaSet=dhakaTest' npm test
npm run build
npm run start
npm run test:browser
```

Database tests create a random `dhaka_test_*` database on loopback only and drop only that database. They never use the production database. For browser tests, start a local replica set on port 27028, then run `npm run test:server -- --production` after building. This harness creates a random isolated database and temporary credentials, applies indexes there, and starts port 3018. In another terminal run `npm run test:browser`; Ctrl-C the harness afterward to remove its test database. Chrome must be installed. See `docs/IMPLEMENTATION.md` for actual execution results and known limitations.

## Deployment and rollback

Do not deploy or run production setup without owner approval. Before release: take a restorable database/GridFS backup; configure secrets and network restrictions; run the index dry run, then approved setup; create accounts interactively; run staging publication and upload checks on an isolated database. Use a Node.js runtime, not Edge, for MongoDB. Keep the existing API hostname serving the Flutter contract.

Deploy application and dependency lockfile together. No existing route data migration is required. Setup is additive/idempotent; unique index creation intentionally fails if historical duplicates exist instead of deleting them. Diagnose duplicates in a dry run and resolve editorially before retrying. For rollback, redeploy the prior application artifact; leave the new collections intact. Restore a database backup only with explicit approval and a recovery plan. Do not delete revisions or reset production collections as a rollback shortcut.

## Owner checklist

- [ ] Rotate exposed database credentials.
- [ ] Configure production secrets, restricted DB user and Atlas network access.
- [ ] Verify www/apex/legacy redirects and Flutter API compatibility.
- [ ] Approve setup/index creation and create real administrator/editor profiles.
- [ ] Confirm the correct Search Console domain/URL-prefix property and inherited verification token.
- [ ] Submit `/sitemap.xml` after the production CMS is configured.
- [ ] Inspect representative published pages, canonical URLs, article language, sitemap entries and robots directives.
- [ ] Review source accuracy, aliases, operational direction and privacy/analytics consent requirements for the intended audience.
