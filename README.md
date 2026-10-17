<p align="center">
  <img src="data/logo/acatalog-wordmark.png" alt="ACatalog" width="760">
</p>

<p align="center">
  <strong>Self-hosted software directory.</strong><br>
  Find an application. Check its source. Deploy it on your own infrastructure.
</p>

<p align="center">
  <a href="https://github.com/cryals/ACatalog/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/cryals/ACatalog/ci.yml?branch=main&style=flat-square&label=CI&labelColor=0a0a0b&color=f5f5f5" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f5f5f5?style=flat-square&labelColor=0a0a0b" alt="AGPL-3.0 license"></a>
  <img src="https://img.shields.io/badge/apps-1%20857-f5f5f5?style=flat-square&labelColor=0a0a0b" alt="1,857 applications">
  <img src="https://img.shields.io/badge/verified%20Compose-746-f5f5f5?style=flat-square&labelColor=0a0a0b" alt="746 verified Compose files">
</p>

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  ACATALOG  /  OPEN-SOURCE SOFTWARE FOR YOUR OWN INFRASTRUCTURE             │
├────────────────────────────────────────────────────────────────────────────┤
│  1 857 APPS   ·   134 CATEGORIES   ·   746 VERIFIED COMPOSE FILES          │
└────────────────────────────────────────────────────────────────────────────┘
```

## What it is

ACatalog is a curated directory for people building a home server, NAS, lab, or private VPS. It turns large self-hosted lists into a fast, inspectable catalogue: search a service, compare alternatives, open its official repository or website, and copy an actual Docker Compose configuration when the source provides one.

No invented deployment instructions. No opaque cards. Every entry keeps its provenance.

## Interface

<table>
  <tr>
    <td width="33%"><strong>SEARCH</strong><br><sub>Name, description, category, tags, aliases.</sub></td>
    <td width="33%"><strong>FILTER</strong><br><sub>Category first; advanced filters only when needed.</sub></td>
    <td width="33%"><strong>VERIFY</strong><br><sub>Source repository, ref, README path, Compose origin.</sub></td>
  </tr>
</table>

The UI is deliberately dark, monochrome and compact: square geometry, white as the only accent, keyboard-accessible controls and responsive navigation. The catalogue, details page, favourites, comparison and data-quality view work without a separate backend.

## Catalogue snapshot

| Signal | Current snapshot |
| --- | ---: |
| Applications | **1,857** |
| Categories | **134** |
| Verified Docker Compose files | **746** |
| Records with a Git repository | **1,755** |
| Average metadata completeness | **83%** |

Snapshot metadata lives in [`data/catalog/quality-report.json`](data/catalog/quality-report.json). The scheduled refresh opens a pull request rather than changing `main` on its own.

## Run locally

Requires Node.js **22+**.

```bash
git clone https://github.com/cryals/ACatalog.git
cd ACatalog
npm ci
npm run dev
```

Vite prints the local address. The prebuilt normalized catalogue is versioned in `data/catalog/`, so browsing the application does not require cloning external sources.

### Production: Docker Compose

```bash
docker compose up --build -d
```

Then open [http://localhost:8080](http://localhost:8080). The production image uses Nginx, a read-only filesystem, security headers, CSP and a `/healthz` healthcheck. For Internet exposure, place it behind your own TLS reverse proxy.

## Data, provenance and Compose

Every catalogue record carries the source of its claims:

- local origin under `raw/<repository>`;
- upstream repository name and URL;
- exact commit SHA/ref used at import time;
- README or Compose path in the upstream project;
- import date, validation state and warnings.

`raw/` and `raw/deployments/` are intentionally **not** committed. They are reproducibly restored from [`data/sources.lock.json`](data/sources.lock.json), and must never be edited to make the frontend more convenient.

When an official Compose file is verified, ACatalog displays its actual text with copy/download controls and a link to the original file. If that relation is uncertain or no Compose file is supplied by the project, the UI links to the official documentation instead.

## Development workflow

```bash
# Recreate the pinned source clones after a fresh checkout
npm run data:bootstrap

# Inspect and build data from the local sources
npm run data:inventory
npm run data:build

# Quality gates
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

Useful maintenance commands:

```bash
npm run data:sources      # update clean source clones
npm run data:github       # GitHub metadata (uses cache; token optional)
npm run data:icons        # favicon / fallback → WebP 512×512
npm run data:deployments  # discover Compose in official repositories
npm run data:version      # write a catalogue snapshot and changelog index
npm run data:all          # run the complete data pipeline
```

Use `GITHUB_TOKEN` via the environment or GitHub Actions secret to avoid the low unauthenticated GitHub API rate limit. Never put a token in the repository.

## Repository map

```text
src/                 Vue 3 application
tests/               Vitest and Playwright coverage
scripts/             import, normalization, enrichment and snapshot pipeline
data/catalog/        normalized catalogue and quality report
data/icons/          local WebP icons and provenance metadata
data/logo/           ACatalog branding assets
data/overrides/      explicit, reviewable pipeline exceptions
public/data/         browser-ready catalogue and Compose payloads
raw/                 external immutable Git inputs (ignored by Git)
deploy/              Nginx configuration for the production container
docs/                operating notes and project decisions
.github/workflows/   CI and weekly refresh automation
```

## Automation

`CI` runs on every pull request and push to `main`: pinned-source bootstrap, catalogue build, lint, strict TypeScript check, unit tests, production build and Playwright smoke tests.

`Refresh catalog` runs weekly and creates a reviewable pull request with updated inputs, metadata, icons and quality data. It never pushes generated data directly into `main`.

## Stack

Vue 3 · TypeScript (strict) · Vite · shadcn-vue conventions · Tailwind CSS 4 · Lucide · IBM Plex Sans · JetBrains Mono · Vitest · Playwright · Sharp · Docker · Nginx

## License

ACatalog is free software licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). In short: you may use, modify and share it under the AGPL terms; if you run a modified version as a network service, you must offer its corresponding source to its users. See [`LICENSE`](LICENSE) for the full text.
