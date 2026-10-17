# ACatalog operations

## Local production check

```bash
npm ci
npm run data:all
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
docker compose up --build
```

The production container is available at `http://localhost:8080`; health is exposed at `/healthz`.

## Source refresh

`raw/` is immutable input during a build. Run `npm run data:sources` to fast-forward every clean clone, review the incoming commits, then run `npm run data:all`. The updater refuses dirty clones and non-fast-forward changes. Never patch source files to improve parsed output; fix the parser or add an explicit override layer.

The scheduled GitHub workflow opens a pull request rather than publishing automatically. This makes source changes, record additions/removals, and quality regressions reviewable.

## GitHub rate limits

`npm run data:github` reads `GITHUB_TOKEN` when available and caches responses for 24 hours in `data/cache/github.json`. Without a token the script stops cleanly when the public rate limit is exhausted; unknown stars remain `null`, not zero.

## Rollback

1. Do not merge a refresh with unexpected removals or a lower quality score.
2. Every accepted refresh creates a compressed snapshot through `npm run data:version`.
3. To recover, restore the previous catalog snapshot or revert the refresh commit, rebuild, and redeploy the resulting immutable image.
4. Never repair a failed production refresh by editing `data/catalog/apps.json` manually.

## Monitoring checklist

- container and `/healthz` availability;
- catalog build failures;
- number of entries, Compose mappings, missing repositories, and pending icons;
- external-link failures in a scheduled link check;
- bundle size and Playwright smoke failures;
- GitHub API rate-limit failures.
