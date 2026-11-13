# Career Navigator implementation report

## Delivered

- Added `/tools/career-navigator/` as a responsive Astro route using the existing `MainGridLayout` and SoraMax theme.
- Added a navigation entry under the existing top-level navbar.
- Added Explore / Build / Apply modes in a reusable Svelte component.
- Added a deterministic reverse-planning engine with explainable skill evidence, requirement matching, mandatory-eligibility filtering, deduplication, stale-record checks, campus expiration checks, source validation, and career-goal recalculation.
- Added local plain-text resume and course-plan normalization with visible manual-review states. PDF/DOCX intentionally fall back to paste in this MVP.
- Added editable, workload-bounded roadmap actions with status changes and reordering.
- Added manual application tracking and explicit no-auto-submit behavior.
- Added source evidence and SAMPLE fixture labels, plus official UCI starting-point links.
- Added provider-independent AI interfaces with deterministic mode as the default; no public bundle contains an API secret or model call.
- Added empty-by-default Greenhouse/Lever/Ashby and campus adapter seams that return explicit unavailable states until allowlists and provider/source validation are configured.
- Added opt-in browser-only local saving and JSON export with draft restoration; default persistence remains off.
- Replaced unsafe validation casts with type guards that return only fully validated StudentProfile, JobPosting, and SourceEvidence values; nested course, experience, requirement, and evidence records are checked.
- Marked tentative course-plan language such as “Maybe later” explicitly while preserving the planned status expected by the existing normalization contract.
- Added explicit privacy-default constants and regression coverage for local-only defaults and no automatic application submission.
- Added unit tests and setup/privacy/source limitations documentation.

## Data model

The model seam lives in `src/lib/career-navigator/types.ts` and includes `JobPosting`, `JobRequirement`, `Skill`, `StudentProfile`, `AcademicCourse`, `DegreeRequirement`, `AcademicPlan`, `ProjectExperience`, `ResearchOpportunity`, `CampusEvent`, `CareerGoal`, `ActionItem`, and `SourceEvidence` (with MVP aliases where the first release uses a shared structure).

## Validation commands

Expected commands from the repository root:

```bash
pnpm test
pnpm check
pnpm type-check
pnpm build
```

External terminal validation reported 12/12 tests passing and a production build passing with 33 pages before the latest type-safe validator and tentative-course patch. That validation also identified TS2352 errors at the former casts in `validation.ts`; those casts have now been replaced with nested type guards and regression tests. TypeScript's `--isolatedDeclarations` was then reported as 22 errors across 12 files; the repository uses `declaration: true` but `noEmit: true` from Astro's base config and has no declaration-output workflow, so the type-check script now uses `tsc --noEmit` while preserving the existing inherited checks and `strictNullChecks`. The two Career Navigator date defaults are explicitly typed as `Date`. Codex PowerShell remains unavailable for a post-patch rerun, so the four commands should be rerun externally to confirm the final patch.

## Branch / deployment note

The repository `.git/HEAD` points to `main`. A feature branch was not created because the shell execution facility was unavailable; no push, merge, or deployment was attempted. Before review, create an isolated branch (for example `feat/career-navigator`) and inspect `git status` so unrelated work remains untouched.

## Known limitations

1. Fixtures are deliberately SAMPLE and not live job data. No Greenhouse, Lever, Ashby, or campus-event adapter is enabled.
2. UCI source links are starting points; the MVP does not assert current events, course availability, prerequisites, units, or graduation eligibility.
3. PDF/DOCX parsing requires a future browser-safe parser with confidence and review controls.
4. The deterministic engine uses an alias vocabulary; it does not claim semantic understanding or replace advisor review.
5. Optional AI provider calls are only an interface. A future server-side adapter must implement consent, redaction, rate limits, timeouts, payload limits, output validation, and private-content logging controls.
