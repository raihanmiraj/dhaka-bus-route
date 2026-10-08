# Administrator API keys

Sign in at `/admin/login`, open **API keys**, enter an integration name and choose an expiration. Copy the full key before dismissing the success panel: it is shown once, never stored in plaintext, and cannot be retrieved later. Create a separate key for each integration. Use **Revoke** to stop access immediately.

```sh
curl https://www.dhakabusroutes.com/api/admin/posts \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

Send the header on every request. API-key requests do not need cookies or an Origin header. Browser sessions still require the configured Origin on mutations. Invalid Authorization headers return 401 even if a valid session cookie is also supplied. Never put keys in URLs or frontend source.

Keys grant the current administrator permissions of their owner. An expired/revoked key, deleted owner or owner who loses the admin role cannot authenticate. A password reset through `scripts/create-admin.ts --reset-password` revokes both sessions and keys. Browser pages and Better Auth's login/logout/session endpoints continue to use session authentication; API keys authenticate CMS and media endpoints.

| Endpoint                                    | Methods / body                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `/api/admin/posts`                          | GET list; POST `{}` creates a draft                                         |
| `/api/admin/posts/ID`                       | GET full post                                                               |
| `/api/admin/posts/ID/save`                  | POST `{ "version": CURRENT_VERSION, "working": COMPLETE_DRAFT }`            |
| `/api/admin/posts/ID/publish`               | POST `{ "version": CURRENT_VERSION }`                                       |
| `/api/admin/posts/ID/unpublish`, `/archive` | POST `{ "version": CURRENT_VERSION }`                                       |
| `/api/admin/posts/ID/restore`               | POST `{ "version": CURRENT_VERSION, "revisionId": REVISION_ID }`            |
| `/api/admin/posts/ID/duplicate`             | POST `{}`                                                                   |
| `/api/admin/posts/ID/revisions`             | GET revision metadata                                                       |
| `/api/admin/categories`, `/tags`            | GET list; POST taxonomy object                                              |
| `/api/admin/categories/ID`, `/tags/ID`      | PATCH taxonomy object; DELETE `{}` when unreferenced                        |
| `/api/admin/media`                          | GET paginated media list                                                    |
| `/api/admin/media/ID`                       | PATCH `{ "alt": "…", "caption": "…" }`                                      |
| `/api/upload`                               | POST multipart field `image` (JPEG, PNG, WebP; up to 3 MB)                  |
| `/media/ID`                                 | GET private image; DELETE unreferenced image                                |
| `/api/admin/settings`                       | GET author profile; PATCH complete profile                                  |
| `/api/admin/corrections`                    | GET reports                                                                 |
| `/api/admin/corrections/ID`                 | PATCH `{ "status": "reviewed" or "dismissed", "note": "…" }`                |
| `/api/admin/links`                          | GET searchable internal links                                               |
| `/api/admin/api-keys`                       | GET own key metadata; POST `{ "name": "Integration", "expiresInDays": 90 }` |
| `/api/admin/api-keys/ID`                    | DELETE revokes own key                                                      |

Supported expiration values are 30, 90 (default), 365 days or `null` for no expiration. Key creation returns HTTP 201 with `{token, key}`. Key lists never return hashes or full tokens. The list includes the latest 200 keys for the current administrator.

For publication, first get the draft's current version, save a complete validated draft, then publish using the version returned by save. Required fields include the title, slug, excerpt, content blocks, primary category, SEO description and featured image with alt text. A stale version returns 409. These validations and publication/reference checks are the same as the dashboard.

No production data migration or new environment variable is required. The `adminApiKeys` collection is created when the first key is saved. Authentication uses its automatic `_id` index; `db:setup` additionally adds an owner/creation-time listing index. Existing posts, sessions and media remain compatible. Rollback can redeploy the previous code; retain the additive key collection.

Validation: 28 automated tests passed against an isolated local MongoDB replica set, including hashed storage, key revocation/expiry, owner role/removal, key ownership and CSRF checks. Production-build HTTP checks additionally passed for login/logout, dashboard markup, all admin API reads, key creation/revocation, image upload/private access and draft save/publication. Local browser visual tests could not run in the restricted runtime (Chromium Unix socket creation is unavailable); the browser regression spec is included in `tests/browser/api-keys.spec.ts` for a browser-enabled environment.
