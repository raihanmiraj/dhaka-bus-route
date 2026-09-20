# Dependency review

Reviewed 2026-09-17. Kept Next.js on the 15.x maintenance line and upgraded 15.4.10 → 15.5.25. React/React DOM are 19.1.4, Better Auth 1.7.5, MongoDB driver 7.6.0, Sharp 0.35.4. The lockfile records exact resolutions.

Primary references:

- https://nextjs.org/blog/august-2026-security-release — Next 15.5.24 minimum patch for the August release; installed later 15.5.25.
- https://better-auth.com/docs/adapters/mongo — supported MongoDB adapter and transaction client.
- https://better-auth.com/docs/reference/options — disabled signup, cookies, sessions and origin checks.
- https://better-auth.com/docs/concepts/rate-limit — database-backed rate limiting.

The initial install exposed transitive PostCSS, nanoid and tar advisories. Compatible overrides pin PostCSS 8.5.28, nanoid 3.3.19 and tar 7.5.22; no forced framework major upgrade was used. `npm audit` returned zero known vulnerabilities after the changes. This is an observation at check time, not a security guarantee. Recheck advisories before deployment and regularly afterward.

ESLint 9 is retained for compatibility with eslint-config-next 15. It emits an upstream support/deprecation notice; this is development tooling, not shipped application code. A future planned lint-tool upgrade can move to the newer ESLint configuration API without forcing a framework rewrite.
