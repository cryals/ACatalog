<p align="center">
  <img src="data/logo/acatalog-wordmark.png" alt="ACatalog" width="720">
</p>

<p align="center">
  <sub><code>README</code></sub><br>
  <a href="README.md"><img src="data/flag/english.webp" alt="English README" width="24" height="16"></a>
  &nbsp;|&nbsp;
  <a href="README_RU.md"><img src="data/flag/russia.webp" alt="Russian README" width="24" height="16"></a>
  &nbsp;|&nbsp;
  <a href="README_UK.md"><img src="data/flag/ukraine.webp" alt="Ukrainian README" width="24" height="16"></a>
</p>

<p align="center">
  <b>A catalog of self-hosted applications.</b><br>
  Find a service → verify the source → run it yourself.
</p>

<p align="center">
  <a href="https://github.com/cryals/ACatalog/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/cryals/ACatalog/ci.yml?branch=main&style=flat-square&label=CI&labelColor=0a0a0b&color=f5f5f5" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f5f5f5?style=flat-square&labelColor=0a0a0b" alt="AGPL-3.0"></a>
</p>

```text
1 857 APPS   /   134 CATEGORIES   /   746 VERIFIED COMPOSE FILES
```

ACatalog helps you choose an open-source SaaS alternative for a home server, NAS, homelab, or VPS. Every record includes official links, metadata, source provenance, and a verified Docker Compose file whenever the project provides one.

## Features

- Search across names, descriptions, categories, tags, and aliases.
- Categories, filters, favourites, and side-by-side comparison.
- A details page with GitHub, website, license, stars, and data provenance.
- Source Compose files: view, copy, download, and open the original source.
- Dark monochrome UI, keyboard navigation, and a responsive layout.

## Quick start

Requires Node.js 22+.

```bash
git clone https://github.com/cryals/ACatalog.git
cd ACatalog
npm ci
npm run dev
```

## Production

```bash
docker compose up --build -d
```

The site will be available at [localhost:8080](http://localhost:8080). The container runs through Nginx with a read-only filesystem, CSP, security headers, and a `/healthz` healthcheck.

## Data

```text
raw/                 source Git clones; not committed or manually edited
data/catalog/        normalized catalog and quality report
data/icons/          WebP icons and their source metadata
public/data/         catalog data and Compose files served to the browser
```

Each record stores its source repository, commit SHA/ref, README or Compose path, import date, and verification status. ACatalog does not invent links, licenses, or configurations: if an official Compose file is not verified, the interface links to the project's documentation instead.

After a fresh clone, restore external sources from the lock file:

```bash
npm run data:bootstrap
npm run data:inventory
npm run data:build
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

CI runs the same checks for every push and pull request. The weekly catalog refresh creates a separate pull request; `main` is never changed automatically.

## Stack

Vue 3 · TypeScript · Vite · shadcn-vue · Tailwind CSS · Lucide · Vitest · Playwright · Sharp · Docker · Nginx

## License

[GNU Affero General Public License v3.0](LICENSE) — AGPL-3.0-only.
