# Career Navigator Phase 3 implementation report

## P0 completed

- Arbitrary pasted job descriptions now use the shared `extractRequirements` pipeline rather than only the predefined skill loop.
- Explicit Mandatory, Preferred, and Unknown lines are retained. Unknown requirements carry original evidence text and are not silently discarded.
- User-pasted postings are marked `provider: "user-provided"`; public snapshots and SAMPLE fixtures remain distinct.
- `generateRoadmap()` receives the active posting and links actions to missing/unknown requirement IDs.
- Recalculation preserves edited titles, explanations, statuses, ordering, and deletions. Career/job changes and an explicit regenerate action create a fresh plan.
- Deterministic local analysis remains functional without a model or network call.

## P1 Worker boundary

Added `apps/career-navigator-api/` with:

- `GET /health`
- `POST /v1/analyze`
- `POST /v1/replan`
- Explicit consent requirement
- Payload limits, timeout, in-memory rate limiting, CORS, provider-optional behavior, structured-output checks, and untrusted-document prompt boundaries
- No committed secrets and no automatic deployment

The Worker returns `503` with `mode: "unavailable"` when provider secrets are absent. Real AI is **not claimed as connected**. The static site remains deterministic-first.

## P2 public job pipeline

- Reused existing adapters and normalization code.
- Verified public board endpoints during implementation for seven boards: Simbe Robotics, Zoox, Robotics & AI Institute, ANYbotics (Lever), Meter, Base Power Company, and Eight Sleep (Ashby).
- Added a scheduled/manual GitHub Actions workflow that runs the static sync and opens a review PR rather than silently publishing changes.
- Sync preserves the previous valid snapshot when a refresh fails with no validated jobs.
- Checked-in `jobs.json` remains an explicit unavailable snapshot until the sync workflow or local command is run.
- Public data is subject to provider terms; no authenticated LinkedIn, Indeed, or Handshake data is accessed.

## P3 UI status

- Existing Apply live discovery panel shows provider, freshness, filters, source links, and local application saving.
- Existing manual job-description analysis now uses arbitrary requirement evidence and active-posting roadmap linkage.
- The deterministic UI does not claim an AI result when the Worker is absent. A future public API URL can be configured via `PUBLIC_CAREER_NAVIGATOR_API_BASE_URL`; model consent and response validation remain required before enabling it.

## Validation status

- `pnpm test`: 41/41 Career and EE unit tests passed.
- `pnpm check`: passed with 0 errors and 5 existing hints.
- `pnpm build`: passed and generated 41 static pages, including both tool routes and EE API routes.
- `pnpm type-check`: still reports only the repository's existing 20 `isolatedDeclarations` diagnostics; no Phase 3 or EE diagnostics remain.
- Targeted Biome CI: passed with existing non-null/import warnings.
- Browser validation covered the consolidated desktop navigation, Projects tool cards, EE Synthetic feed, Career Explore/Build/Apply, and the disabled AI provider boundary when no Worker URL is configured.

The optional Worker remains provider-optional. No model secret or public Worker URL is committed, and deterministic local analysis remains the default.

## Remaining prioritized work

1. Run the sync workflow once, review the generated snapshot/PR manually, and confirm actual current listings before merging any data update.
2. Finish the small frontend AI control panel and connect it only when a deployed Worker URL and consent flow are configured.
3. Add Worker integration tests for provider timeout, rate limit, missing secret, malformed model output, and oversized payload.
4. Add browser acceptance coverage for arbitrary pasted JD extraction, roadmap edits, and original posting links.
5. Add versioned UCI event/catalog synchronization with confirmed dates and catalog-year evidence.
