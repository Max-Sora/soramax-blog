# EE Intelligence Phase 1 review

This review records what exists in the workspace and what the public demo is allowed to expose. The implementation stays in the existing `soramax-blog` repository; it does not create a second EE Intelligence project.

## Existing data path

- The EE-Agent project note describes a local-first SQLite knowledge store with FTS5, source citations, fingerprints and an isolated schema-v3 acceptance path. It also states that the production runtime database is a different schema/state and that live external collection is only partially verified.
- `uci_event_router/storage.py` is the available local SQLite reference in this workspace. It uses parameterized writes, deterministic event identity, a dedupe key, an audit log and a dry-run queue. It is an event router, not a news classifier, and it must stay outside the public bundle.
- The SoraMax site is a static Astro/Svelte build. It has no server-side SQLite connection, credential boundary or private database mount. The public page therefore uses a small, synthetic fixture and a browser-side search function that mirrors the FTS5 query seam without pretending to be FTS5.

## Phase 1 implementation

`src/lib/ee-intelligence/engine.ts` provides deterministic, unit-tested primitives for:

1. exact URL/id deduplication;
2. event clustering by category, entity overlap, time window and title similarity;
3. transparent importance ranking with a human-readable score;
4. source provenance and evidence polarity (`supports`, `contradicts`, `mixed`, `unknown`);
5. uncertainty reasons when evidence is single-source, conflicting or low-confidence;
6. a leakage-safe historical replay that enters strictly after publication and subtracts round-trip costs.

The input fixtures are explicitly synthetic. No private records, API keys, live feeds or automated order path are shipped.

## Boundary conditions

- The score and polarity fields are review cues, not verified facts or model authority.
- The backtest is a plumbing demonstration over synthetic bars. It cannot establish a profitable strategy, expected return or suitability.
- A future production collector should persist `observed_at`, parser version, raw source reference, content-read status, classifier version and failure state in SQLite. FTS5 should index the normalized, provenance-linked text while retaining the original record for audit.
- Any deployment that reads a private database should be a separate authenticated service. It should never be reachable from this public static page.

## Validation checklist

- Unit tests: `pnpm test` includes `src/lib/ee-intelligence/engine.test.ts`.
- Static checks: `pnpm type-check` and `pnpm check`.
- Build: `pnpm build`.
- Manual E2E: open `/tools/ee-intelligence/`, switch Event Intelligence / Signal Lab / Method tabs, search `thermal`, select an event, move cost and holding sliders, and confirm the ledger keeps entry dates after signal dates.
