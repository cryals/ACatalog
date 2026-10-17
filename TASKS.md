# ACatalog — Task Board

Last reviewed: 17 October 2026.

This board records the current project state. `raw/` is external, immutable input: changes to catalog data belong in the import pipeline or explicit override files, never in source clones.

## Now

| Priority | Task | Outcome | Status |
| --- | --- | --- | --- |
| — | No active implementation task | The application is ready for the next planned item. | Ready |

## Next

| Priority | Task | Definition of done |
| --- | --- | --- |
| High | Translate catalog descriptions | Add a reviewed translation pipeline for project descriptions in Russian and Ukrainian. Preserve the original English text and provenance; do not invent translated product facts. |
| High | Run full responsive visual QA | Review catalog, details, comparison, quality, filters, locale menu, and footer at mobile, tablet, and desktop widths; fix any overflow, focus, or touch-target issues. |
| Medium | Automate external-link checks | Schedule `npm run data:links`, preserve its report as a CI artifact, and open an issue or PR only for actionable failures. |
| Medium | Add mobile E2E coverage to CI | Run the existing responsive-sidebar scenario in a mobile browser project instead of skipping it in the desktop-only Chromium run. |
| Medium | Review each catalog refresh PR | Check additions/removals, provenance, Compose mappings, quality score, and icon sources before merging automated weekly updates. |
| Low | Deploy to a VPS | Build and deploy the immutable Docker image, configure TLS and monitoring, then test `/healthz`. Deliberately out of scope until hosting details are supplied. |

## Done

| Area | Delivered |
| --- | --- |
| Catalog | Reproducible import pipeline with source provenance, repository refs, Compose source paths, validation state, and quality report. |
| Data | 1,857 catalog records, 134 categories, and 746 verified Compose files in the current generated catalog. |
| Search & browsing | Full-text search across names, descriptions, categories, tags, and aliases; categories, filters, favourites, comparison, grid/list views, and details pages. |
| Compose | Verified Compose content is viewable, copyable, downloadable, and linked back to its original source. |
| Interface | Minimal dark monochrome UI with responsive sidebar, forced dark mode, keyboard navigation, footer layout, compact language flags, and constrained app-icon sizes. |
| Localization | English is the default. UI translations exist for English, Russian, and Ukrainian; language selection persists locally. English catalog data and static shell contain no Cyrillic text before a non-English language is selected. |
| Documentation | English primary README plus Russian and Ukrainian copies, all linked with compact flag controls that use `data/flag/*.webp`. |
| Operations | Docker Compose/Nginx production setup, read-only container filesystem, CSP/security headers, and `/healthz` endpoint. |
| Automation | CI runs install, audit, data rebuild, lint, typecheck, unit tests, production build, and Chromium smoke tests. A weekly workflow refreshes sources and opens a reviewable PR. |
| Validation | Latest local checks passed: typecheck, ESLint, Vitest, production build, and Chromium Playwright smoke suite (7 passed; one mobile-only test intentionally skipped in that desktop project). |

## Working agreements

- Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`, and `npm run test:e2e` before merging implementation changes.
- Never modify `raw/` for frontend convenience. Fix the parser or add a documented override.
- Do not publish guessed sites, GitHub URLs, licenses, stars, or Compose files.
- Treat automated catalog refreshes as reviewable data changes, not automatic production deployments.
