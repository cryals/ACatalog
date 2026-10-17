# ADR-001: versioned JSON for the catalog

## Decision

ACatalog serves a versioned static JSON payload and performs ranked search in the browser. The current catalog contains 1,799 records; the compressed application bundle and indexed fields remain small enough for a static deployment, CDN caching and offline inspection.

## Why not SQLite or PostgreSQL yet

Neither database improves the current read-only UX enough to justify a backend, migrations and operations surface. Generated JSON is reproducible from `raw/`, easy to diff in pull requests and can be rolled back as one immutable artifact.

## Migration trigger

Move search to SQLite FTS5 (single-node) or PostgreSQL (multi-writer/API) when any of these becomes true:

- the normalized catalog exceeds 10,000 entries;
- the compressed payload exceeds 5 MB;
- browser search has p95 interaction latency above 100 ms on a representative mobile device;
- user accounts, shared collections or server-side moderation require durable writes.

The `CatalogApp` contract and URL query model remain the boundary for that migration.
