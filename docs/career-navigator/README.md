# SoraMax Career Navigator

Phase 1 + Phase 2 implementation for `/tools/career-navigator/`. It remains a local-first, no-account reverse-planning tool for UCI Electrical Engineering students and adjacent explorers, now with a static-friendly public job sync seam and verified UCI resource records.

## Run locally

From the repository root:

```bash
pnpm dev
```

Open: `http://localhost:4321/tools/career-navigator/`

The repository requires pnpm (see `package.json`) and Node.js 22+.

## What works now

- **Explore:** enter school, major, academic year, interests, strengths, constraints, and compare four visibly labeled planning directions: Embedded Systems Engineer, Digital / ASIC Engineer, Robotics Engineer, and Undergraduate Research.
- **Build:** paste a resume or course plan; parse plain text/Markdown/CSV locally; review extracted records; enter a catalog year; compare mapped skills; generate a bounded roadmap; accept, reject, reorder, or mark actions done; select light/balanced/stretch workload.
- **Apply:** paste a job description or load a visibly labeled SAMPLE fixture; distinguish matched, missing, and unknown requirements; show an explainable evidence-coverage score; manually track application status. No applications are submitted.
- **Live discovery:** APPLY includes a build-time snapshot panel for validated public Greenhouse, Lever, and Ashby records. The checked-in snapshot is explicitly unavailable/empty until a reviewed board allowlist is synced; it never pretends sample data is live.
- **Campus panel:** links to official UCI starting points for career fairs, career events, Engineering course planning, the Catalogue, UROP, and existing career/research resources. Dates remain UNKNOWN unless confirmed by the source.
- **Privacy controls:** no account, no network AI call, no default persistence. Optional browser-only draft saving/restoration and JSON export are user-controlled.

## Evidence and safety boundaries

- SAMPLE career frameworks and job postings are not live job data. They are marked in the UI and must be replaced with a verified posting or user-provided description before applying.
- UCI links are official starting points. Dates, eligibility, openings, course availability, prerequisites, units, and graduation rules are not asserted by the MVP.
- Course-plan rows are unverified user notes. Phrases such as “Maybe later” are marked as tentative rather than treated as firm commitments. The navigator never claims that a generated plan guarantees graduation. Confirm official enrollment decisions with the current UCI catalog and an academic counselor.
- A missing mapped skill means “not found in the current local notes,” not “the student lacks it.”
- Match percentages represent evidence coverage across the selected requirements; they are not employment probabilities.
- Pasted job text is treated as untrusted data. It cannot issue commands to the app.
- PDF/DOCX extraction is intentionally a paste fallback in this release. Plain text, Markdown, and CSV can be read in the browser.

## Data model and extension seams

`src/lib/career-navigator/types.ts` defines the Phase 2/3 vocabulary: `JobPosting`, `JobRequirement`, `Skill`, `StudentProfile`, `AcademicCourse` (represented by `CourseRecord` in this MVP), `DegreeRequirement` (reserved for verified catalog data), `AcademicPlan`, `ProjectExperience`, `ResearchOpportunity` (represented by `CampusOpportunity`), `CampusEvent`, `CareerGoal`, `ActionItem` (represented by `RoadmapAction`), and `SourceEvidence`.

`src/lib/career-navigator/engine.ts` is deterministic and has no network dependency. `ai.ts` defines a provider-independent `CareerAnalysisProvider` seam plus a deterministic provider. A future backend adapter must enforce consent, payload limits, timeouts, rate limits, private-content redaction, and output validation before sending any resume or academic data to a model.

`src/lib/career-navigator/adapters.ts` and `src/lib/career-navigator/phase2.ts` provide the Phase 2 adapter, normalization, freshness, evidence, and static snapshot seams. `scripts/career-navigator-sync.ts` reads an explicit `CAREER_NAVIGATOR_BOARDS_JSON` allowlist and writes `src/data/career-navigator/jobs.json`. The current allowlist is intentionally empty and returns an explicit unavailable state. Do not scrape authenticated LinkedIn, Indeed, or Handshake pages.

## Tests and validation

```bash
pnpm test
pnpm check
pnpm type-check
pnpm build
```

The test suite covers Phase 1 normalization/matching/privacy/roadmap behavior plus Phase 2 public-provider normalization, timestamp separation, sanitization, deduplication, unavailable snapshots, and UCI source uncertainty. Build runs the repository's existing icon/LQIP/Astro/Pagefind pipeline.

## Prioritized backlog

1. Add a versioned UCI catalog adapter with source publication dates and catalog-year applicability; keep unknowns un-enforced.
2. Add a separately deployable Cloudflare Worker provider with explicit consent and redaction; preserve deterministic mode when it is unavailable.
3. Add allowlisted Greenhouse/Lever/Ashby build-time synchronization with provider terms, rate limits, deduplication, and stale states.
4. Add browser-safe PDF/DOCX extraction with visible confidence and manual review, or keep the paste fallback if extraction cannot be made trustworthy.
5. Add verified UCI campus-source adapters for events, research openings, project teams, and organizations with expiration handling.
6. Add richer application notes, role-specific portfolio review, export formats, and optional account sync only after privacy review.
