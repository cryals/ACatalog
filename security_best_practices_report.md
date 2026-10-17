# ACatalog security review

## Executive summary

The Vue/TypeScript application, data pipeline, dependency tree, and Nginx production configuration were reviewed on 2026-10-14. No critical, high, or medium application-security findings remain. `npm audit --audit-level=high` reports zero known vulnerabilities.

The application is intentionally static and has no authentication, cookies, privileged API, or server-side write surface. Bookmarks and comparisons store only public application slugs in browser storage.

## Critical findings

None.

## High findings

None.

## Medium findings

None.

## Low findings and operational notes

### SEC-001 — External metadata remains untrusted input

- Severity: Low / operational
- Location: `scripts/build-catalog.ts`, `src/components/AppCard.vue`, `src/pages/AppDetailsPage.vue`
- Evidence: catalog titles, descriptions, links, Compose YAML, and icon candidates originate from external Git clones and websites.
- Control: Vue interpolation renders text without HTML interpretation; there is no `v-html`; outbound links pass through an `http:`/`https:` allowlist; icon paths are restricted to `/data/icons/<slug>.webp`; Compose is shown as text; favicon downloads enforce an 8-second timeout and a 5 MB cap.
- Impact: a compromised source can still publish misleading text or malicious container configuration, but cannot directly execute script in ACatalog through the current rendering path.
- Recommendation: keep source refreshes pull-request based and review unexpected removals, links, and Compose changes before merging.

### SEC-002 — Deployment headers must be preserved

- Severity: Low / operational
- Location: `deploy/nginx.conf:10`
- Evidence: CSP, `X-Content-Type-Options`, clickjacking protection, `Referrer-Policy`, and `Permissions-Policy` are set in the supplied Nginx configuration.
- Impact: replacing Nginx or overriding headers at a reverse proxy can weaken defense in depth.
- Recommendation: verify the same headers at the final public endpoint after VPS deployment. Do not add `unsafe-eval` or `unsafe-inline` to `script-src`.

## Verified controls

- No `v-html`, `innerHTML`, `eval`, dynamic template compilation, dynamic script injection, or `javascript:` navigation in application source.
- Every `target="_blank"` link includes `rel="noopener noreferrer"`.
- No frontend secrets or authentication tokens are stored in source or browser storage.
- Production uses an immutable static build, not the Vite development server.
- Nginx serves a strict self-only CSP and denies framing.
- Container runs read-only with dropped capabilities and `no-new-privileges` in Docker Compose.
- Lockfile exists; CI runs `npm audit --audit-level=high`.
- External image processing uses the patched Sharp release and bounded downloads.
