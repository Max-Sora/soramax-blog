# EE Intelligence Phase 2 review

Phase 2 keeps the public surface in the existing `soramax-blog` Astro/Svelte repository. It does not mount the private SQLite database in the browser and does not add a broker or order path.

## Product surface

`/tools/ee-intelligence/` is now a Personal Intelligence Agent Platform demo. The same page exposes Overview, Intelligence Feed, Case Explorer, Hardware Diagnosis, Agent Monitor, Event Intelligence, Signal Lab and Method & Limits. The first five modules share a public contract rather than maintaining separate search or storage implementations:

```text
public RSS / synthetic fixtures
        ↓
collect → normalize → deduplicate → evidence links
        ↓
Source · IntelligenceRecord · Evidence · Case · AgentRun · Insight
        ↓
Feed / Case Explorer / Diagnosis / Monitor / Event Intelligence / Signal Lab
```

`src/lib/ee-intelligence/knowledge.ts` is the public projection and deterministic diagnosis layer. `diagnoseHardware` performs term retrieval over the explicitly synthetic case library, ranks possible causes, produces next checks and keeps unknowns visible. There is no LLM backend in this public demo, so the UI labels the result as retrieval and rules.

## Public collection path

`src/lib/ee-intelligence/live.ts` defines a small allowlist of public RSS feeds:

- The Verge RSS — `https://www.theverge.com/rss/index.xml`
- Ars Technica RSS — `https://feeds.arstechnica.com/arstechnica/index`
- TechCrunch RSS — `https://techcrunch.com/feed/`
- U.S. SEC press-release RSS — `https://www.sec.gov/news/pressreleases.rss`

`parsePublicFeed` normalizes RSS and Atom-style entries into records with the feed URL, article URL, publication time, first-seen time, GUID, canonicalized URL, deterministic dedupe key, category, company mapping, polarity cue, confidence and freshness state. The classifier is a transparent keyword cue; it is not a claim that the article proves a market outcome.

`src/lib/ee-intelligence/collector.ts` performs incremental collection with `ETag` / `Last-Modified` headers, a per-feed cache under `cache/ee-intelligence/`, last-good cache reuse on failure, and an explicit unavailable state when no usable data exists. Run `pnpm ee-intelligence:sync` before publishing a static build. The generated public snapshot is `src/data/ee-intelligence/live-snapshot.json` and contains no credentials or cookies.

The same sync command also writes `src/data/ee-intelligence/public-snapshot.json` through `buildPublicKnowledge` and `sanitizePublicSnapshot`. The allowlist contains only source metadata, normalized records, evidence, synthetic cases, redacted agent run summaries and insights. `/api/ee-intelligence/public.json` serves that projection for static deployments; raw SQLite, private paths, cookies, tokens and API keys are excluded.

The feeds are public and read-only. The collector does not bypass access controls, solve CAPTCHAs, scrape private pages or imitate a browser to defeat rate limits. Feed terms, licensing, availability, parser drift and rate limits remain external risks.

## Decision engine

Event aggregation still happens before signals are calculated. Multiple reports sharing a topic, entities, time window and title similarity become one event cluster with linked sources. `src/lib/ee-intelligence/signals.ts` then produces a research cue per detected company:

- `facts` are source summaries and evidence statements;
- `inferences` describe the rule-based directional cue;
- `unknowns` retain conflicts, low-confidence evidence and missing tickers;
- direction is `bullish`, `bearish`, `neutral` or `insufficient_data`.

No direction is produced for an unknown company or an event with insufficient evidence. The page keeps Live failure separate from Synthetic mode and never silently swaps data modes.

## Signal Lab

`src/lib/ee-intelligence/market.ts` first requests Yahoo Finance's public chart API and then tries the public Stooq daily CSV adapter. The user must explicitly load market bars. `src/lib/ee-intelligence/engine.ts` enforces entry after publication, then applies optional signal delay, fees and slippage. `src/lib/ee-intelligence/walkforward.ts` reports a later event window and a simple buy-and-hold benchmark for comparison.

The public market adapters may not contain complete corporate-action adjustments, delisted symbols, venue-specific prices or survivorship-complete history. The UI therefore labels live results as research infrastructure and shows `insufficient data` when bars are missing. Synthetic results remain visibly synthetic and cannot be presented as verified profitability.

## Validation

- `pnpm test` covers Phase 1 plus RSS parsing, freshness, cache recovery, company signals, market parsing, walk-forward ordering, public projection, deterministic diagnosis, search and sanitization.
- `pnpm type-check`, `pnpm check` and `pnpm build` are required before publishing.
- Playwright tests cover the route, mode switch, Signal Lab, Feed → Diagnosis → Monitor flow, public snapshot endpoint and mobile viewport screenshots.

## Honest boundaries

The current public data snapshot contains live public RSS records collected by the allowlisted feeds and four clearly labelled `Synthetic Demo` hardware cases. WeChat, Bilibili, private SQLite/FTS5 and an LLM diagnosis backend are shown as unverified or private until a successful, permissioned connector run exists. Signal Lab remains a deterministic research replay and never becomes an auto-trading path.
