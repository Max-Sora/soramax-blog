# Career Navigator Phase 2 implementation report

## Scope delivered

Phase 2 extends the existing Phase 1 Astro/Svelte Career Navigator without introducing a new framework or moving private profile data to a server.

- Added normalized public job fields for provider, source URL, application URL, employment type, internship eligibility, work mode, description, compensation, observed/published/updated timestamps, and freshness.
- Added public Greenhouse, Lever, and Ashby adapters with timeouts, retry/backoff, response-shape checks, normalization, deduplication, and explicit unavailable/empty states.
- Added `pnpm career-navigator:sync`, a static-friendly build-time/manual sync script. It reads an explicit `CAREER_NAVIGATOR_BOARDS_JSON` allowlist and writes `src/data/career-navigator/jobs.json`.
- Kept the allowlist empty by default. The UI never presents the empty snapshot as proof that no jobs exist.
- Added a live internship discovery panel to APPLY mode. It filters the validated snapshot, displays freshness, explains requirements through the existing deterministic engine, and saves records to the existing local application tracker.
- Added official UCI starting-point resources for career fairs, career events, Engineering course planning, the Catalogue, and UROP. Event dates are UNKNOWN unless confirmed by the source.
- Added Phase 2 adapter/normalization/source tests while preserving Phase 1 tests and behavior.
- Added explicit sample/live/unavailable separation and documented the static hosting limitations.

## Public sources

Provider documentation and public endpoint conventions:

- Greenhouse Job Board API: https://docs.greenhouse.io/job-board
- Lever postings API: https://github.com/lever/postings-api
- Ashby public job posting API: https://developers.ashbyhq.com/docs/public-job-posting-api

Initial official UCI sources:

- https://career.uci.edu/career-fairs/
- https://career.uci.edu/about/events/
- https://undergraduate.eng.uci.edu/advising/course-planning/
- https://catalogue.uci.edu/
- https://urop.uci.edu/

## Static hosting and licensing boundaries

GitHub Pages serves generated files and cannot safely run private server code, scheduled jobs, or secret-bearing API calls. The sync script is intentionally separate from the browser bundle. A maintainer must configure a reviewed public board allowlist and run the sync in a controlled build/CI environment; no provider credentials are required for these public endpoints, but public accessibility is not treated as unlimited redistribution permission.

The generated snapshot records observation time separately from provider publication/update timestamps. If a provider omits a date, the field remains UNKNOWN. Stale and unavailable states are retained rather than silently presented as current openings. Job descriptions are sanitized and treated as untrusted data.

No authenticated LinkedIn, Indeed, or Handshake data is scraped. When a UCI resource directs a student to Handshake, the UI links to the official resource rather than attempting to access private data.

## Current live-data status

The checked-in `jobs.json` is intentionally empty/unavailable because no company board allowlist has been approved in this repository. This is an honest empty state, not a claim that the market has no openings. To perform a local refresh after review:

```bash
set CAREER_NAVIGATOR_BOARDS_JSON=[{"provider":"lever","company":"Verified Company","boardId":"verified-board-id","publicUrl":"https://jobs.lever.co/verified-board-id"}]
pnpm career-navigator:sync
```

Use the shell syntax appropriate to the environment. Review provider terms and the company board URL before adding any entry. Do not commit personal profile/resume data or secret credentials into generated assets.

## Validation status

Phase 1 external validation previously reported 12/12 tests passing and a 33-page production build. Phase 2 adds `phase2.test.ts` and expands the test script. Codex PowerShell is unavailable in this session, so final Phase 2 test/check/type-check/build results are UNVERIFIED here. Run:

```bash
pnpm test
pnpm check
pnpm type-check
pnpm build
```

## Prioritized Phase 3 backlog

1. Configure a reviewed, small company-board allowlist and run scheduled CI synchronization with frozen-lockfile builds and artifact diff review.
2. Add a versioned UCI event/catalog adapter with publication dates, catalog-year applicability, prerequisite evidence, and explicit UNKNOWN states.
3. Add source-level field provenance and a UI detail view for requirement evidence and provider errors.
4. Add pagination support when a provider board requires it, plus per-provider rate-limit telemetry and retry metrics.
5. Add a separately deployed Cloudflare Worker for consented AI analysis without changing deterministic fallback behavior.
6. Add accessibility-focused browser acceptance tests for live filtering, source links, and application tracking.
