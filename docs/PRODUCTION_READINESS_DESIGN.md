# ACatalog production-readiness design

## Goal

Close the gaps found in the 2026-10-14 audit without changing the approved visual direction or deploying to a VPS.

## Reproducible sources

`raw/` is an ignored working cache. `data/sources.lock.json` is the tracked source of truth containing repository URL, branch, commit SHA and precedence. `data:bootstrap` checks out pinned commits; `data:sources` advances them and updates the lock for a reviewable pull request.

## Data integrity

Final unique slugs are assigned before icon paths. Runtime and architecture inference use token boundaries. Every source reference exposes a commit-pinned file URL where the provider supports it. Generated reports include duplicate and conflict counts.

## Build and release

Import and application verification are separate CI jobs. The application build consumes reviewed generated data. Bundle budgets, link checks, desktop/mobile Playwright and a Docker smoke test gate release artifacts.

## Security

Nginx security headers are included in every location that defines caching headers. External metadata remains text-only, remote URLs retain protocol allowlists, and downloaded icons remain size- and MIME-bounded.

## Operational boundaries

Named browser-local collections do not require a backend. Server search remains deferred until the thresholds in ADR-001 are crossed. Public deployment and external uptime-provider configuration remain outside this phase.
