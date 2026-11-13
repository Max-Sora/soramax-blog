<script lang="ts">
	import { aggregateEvents, deduplicateNews, rankEvents, runBacktest, searchNews, sourceTierLabel } from "@/lib/ee-intelligence/engine";
	import { demoNews, demoPrices, demoSources } from "@/lib/ee-intelligence/fixtures";
	import type { BacktestConfig, EventCluster, EvidencePolarity } from "@/lib/ee-intelligence/types";

	type Mode = "events" | "signals" | "method";
	let mode: Mode = "events";
	let query = "";
	let category = "all";
	let selectedEventId = "";
	let threshold = 45;
	let costBps = 25;
	let holdingDays = 2;
	let symbol = "SIM-EE";
	let start = "2026-09-07";
	let end = "2026-09-25";
	let events: EventCluster[] = [];

	$: dedupeStats = deduplicateNews(demoNews);
	$: events = rankEvents(aggregateEvents(demoNews, demoSources));
	$: visibleNews = searchNews(dedupeStats.items, query).filter((item) => category === "all" || item.category === category);
	$: visibleArticleIds = new Set(visibleNews.map((item) => item.id));
	$: visibleEvents = events.filter((event) => category === "all" || event.articleIds.some((articleId) => visibleArticleIds.has(articleId)));
	$: selectedEvent = events.find((event) => event.id === selectedEventId) ?? visibleEvents[0] ?? events[0];
	$: backtestConfig = ({ symbol, start, end, importanceThreshold: threshold, costBps, holdingDays } satisfies BacktestConfig);
	$: backtest = runBacktest(events, demoPrices, backtestConfig);

	function formatPercent(value: number) {
		return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
	}

	function polarityLabel(polarity: EvidencePolarity) {
		return polarity === "supports" ? "支持" : polarity === "contradicts" ? "反向" : polarity === "mixed" ? "混合" : "未知";
	}

	function openEvent(event: EventCluster) {
		selectedEventId = event.id;
		mode = "events";
	}
</script>

<svelte:head>
	<title>EE Intelligence · SoraMax Demo</title>
	<meta name="description" content="Local-first Event Intelligence and Signal Lab demo with provenance, uncertainty and leakage-safe backtesting." />
</svelte:head>

<div class="ee-shell">
	<section class="ee-hero card-base">
		<div class="hero-copy">
			<div class="eyebrow">EE INTELLIGENCE · PHASE 1</div>
			<h1>From noisy headlines<br /><span>to reviewable decisions.</span></h1>
			<p>Event Intelligence collapses duplicate coverage into one event, keeps every source visible, and separates evidence from uncertainty. Signal Lab replays the same event timeline with a strict next-bar entry rule.</p>
			<div class="hero-badges"><span class="badge badge-primary">PUBLIC DEMO</span><span class="badge">SIMULATED DATA</span><span class="badge">NO AUTO-TRADING</span></div>
		</div>
		<div class="hero-telemetry"><div><span>ARTICLES</span><strong>{demoNews.length}</strong></div><div><span>AFTER DEDUPE</span><strong>{dedupeStats.items.length}</strong></div><div><span>EVENTS</span><strong>{events.length}</strong></div><small>Fixture snapshot · 2026-09-28</small></div>
	</section>

	<div class="demo-notice"><span class="notice-mark">!</span><div><strong>公开只读 Demo · 数据为模拟快照</strong><p>所有标题、来源和价格均为合成示例，用于演示追踪、聚合和回测流程；不连接私有数据库，也不代表真实新闻、收益或投资建议。</p></div></div>

	<nav class="mode-tabs" aria-label="EE Intelligence modes">
		<button class:active={mode === "events"} class="mode-tab" on:click={() => mode = "events"} aria-pressed={mode === "events"}><strong>EVENT INTELLIGENCE</strong><span>聚合事件与证据</span></button>
		<button class:active={mode === "signals"} class="mode-tab" on:click={() => mode = "signals"} aria-pressed={mode === "signals"}><strong>SIGNAL LAB</strong><span>历史回测实验</span></button>
		<button class:active={mode === "method"} class="mode-tab" on:click={() => mode = "method"} aria-pressed={mode === "method"}><strong>METHOD &amp; LIMITS</strong><span>边界与审计线索</span></button>
	</nav>

	{#if mode === "events"}
		<section class="toolbar card-base">
			<div class="search-field"><span>⌕</span><input bind:value={query} aria-label="Search demo news" placeholder="Search event, entity, or source..." /></div>
			<label>Category<select bind:value={category}><option value="all">All categories</option><option value="policy">Policy</option><option value="supply">Supply</option><option value="research">Research</option><option value="company">Company</option><option value="market">Market</option></select></label>
			<span class="toolbar-meta">{visibleNews.length} records · {visibleEvents.length} clusters</span>
		</section>
		<section class="event-layout">
			<div class="event-list">
				<div class="section-heading"><div><span class="section-kicker">01 · TRIAGE</span><h2>Ranked event queue</h2></div><span class="source-chip">PROVENANCE ON</span></div>
				<p class="muted">Importance combines reported impact, source breadth, recency and coverage count. It is a prioritization aid, not a probability of market movement.</p>
				{#each visibleEvents as event, index}
					<button class:selected={selectedEvent?.id === event.id} class="event-card" on:click={() => openEvent(event)}>
						<div class="event-index">{String(index + 1).padStart(2, "0")}</div><div class="event-card-main"><div class="event-card-top"><span class={`importance ${event.importanceLabel}`}>{event.importanceLabel.toUpperCase()} · {event.importanceScore}</span><span class="uncertainty-dot {event.uncertainty}"></span><span class="uncertainty-label">uncertainty {event.uncertainty}</span></div><h3>{event.title}</h3><p>{event.summary}</p><div class="event-meta"><span>{event.occurredAt}</span><span>{event.sources.length} sources</span><span>{event.articleIds.length} reports</span></div></div><span class="event-arrow">→</span>
					</button>
				{:else}
					<div class="empty-state">No matching records. Try a broader search.</div>
				{/each}
			</div>
			<aside class="event-detail card-base">
				{#if selectedEvent}
					<div class="detail-top"><span class="section-kicker">SELECTED EVENT</span><span class={`importance ${selectedEvent.importanceLabel}`}>{selectedEvent.importanceScore} PRIORITY</span></div>
					<h2>{selectedEvent.title}</h2><p>{selectedEvent.summary}</p>
					<div class="detail-row"><span>First observed</span><strong>{selectedEvent.occurredAt}</strong></div><div class="detail-row"><span>Uncertainty</span><strong class="uncertainty-text {selectedEvent.uncertainty}">{selectedEvent.uncertainty}</strong></div>
					{#if selectedEvent.uncertaintyReasons.length > 0}<div class="uncertainty-box"><strong>Why uncertainty stays visible</strong><ul>{#each selectedEvent.uncertaintyReasons as reason}<li>{reason}</li>{/each}</ul></div>{/if}
					<div class="detail-section"><div class="section-heading small"><h3>Evidence ledger</h3><span>{selectedEvent.evidence.length} signals</span></div>{#each selectedEvent.evidence as evidence}<div class="evidence-row"><span class="polarity {evidence.polarity}">{polarityLabel(evidence.polarity)}</span><p>{evidence.statement}</p></div>{/each}</div>
					<div class="detail-section"><div class="section-heading small"><h3>Sources</h3><span>{selectedEvent.sources.length} linked</span></div>{#each selectedEvent.sources as source}<a class="source-row" href={source.url} target="_blank" rel="noreferrer"><span><strong>{source.name}</strong><small>{sourceTierLabel(source)} · observed {source.observedAt.slice(0, 10)}</small></span><span>↗</span></a>{/each}</div>
				{:else}<div class="empty-state">Select an event to inspect its evidence.</div>{/if}
			</aside>
		</section>
	{:else if mode === "signals"}
		<section class="signal-grid">
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">01 · CONFIGURE</span><h2>Replay the event timeline</h2></div><span class="source-chip sample-chip">SIMULATED ONLY</span></div>
				<p class="muted">Signals are derived from the event ledger only. A position can enter on the first price bar strictly after publication, then exits after the selected holding window.</p>
				<div class="field-grid"><label>Symbol<select bind:value={symbol}><option>SIM-EE</option></select></label><label>Minimum importance<strong class="range-value">{threshold}</strong><input type="range" min="35" max="80" step="1" bind:value={threshold} /></label><label>Round-trip cost (bps)<strong class="range-value">{costBps}</strong><input type="range" min="0" max="100" step="5" bind:value={costBps} /></label><label>Holding bars<strong class="range-value">{holdingDays}</strong><input type="range" min="1" max="5" step="1" bind:value={holdingDays} /></label></div>
				<div class="date-row"><label>Start<input type="date" bind:value={start} /></label><label>End<input type="date" bind:value={end} /></label></div>
				<div class="rule-callout"><span>↳</span><div><strong>Leakage guard</strong><p>Entry date must be later than the event's observed date. The event's future price path is never used to rank or label the event.</p></div></div>
			</div>
			<div class="card-base result-panel"><div class="result-header"><div><span class="section-kicker">02 · RESULT</span><h2>Backtest snapshot</h2></div><span class="status-chip">{backtest.noLookahead ? "NO LOOKAHEAD" : "REVIEW"}</span></div><div class="result-hero"><strong>{formatPercent(backtest.totalReturn)}</strong><span>net return · simulated</span></div><div class="metric-grid"><div><span>Trades</span><strong>{backtest.trades.length}</strong></div><div><span>Win rate</span><strong>{(backtest.winRate * 100).toFixed(0)}%</strong></div><div><span>Costs</span><strong>{formatPercent(backtest.totalCosts)}</strong></div><div><span>Max drawdown</span><strong>{formatPercent(-backtest.maxDrawdown)}</strong></div></div><div class="curve"><span class="curve-label">EQUITY PATH</span><div class="curve-line">{#each backtest.equityCurve as point, index}<i style={`height: ${Math.max(12, Math.min(100, point.value * 72))}%`} class:down={index > 0 && point.value < backtest.equityCurve[index - 1]!.value} title={point.date}></i>{/each}</div><small>1.00 start · costs included at entry/exit</small></div><p class="result-disclaimer">This result is a deterministic replay of synthetic prices. It is not a validated strategy, forecast, or recommendation.</p></div>
		</section>
		<section class="card-base panel-pad trade-panel"><div class="section-heading"><div><span class="section-kicker">03 · AUDIT TRAIL</span><h2>Trade ledger</h2></div><span class="source-chip">{backtest.trades.length} FILLED</span></div>{#if backtest.trades.length > 0}<div class="table-wrap"><table><thead><tr><th>Event</th><th>Signal</th><th>Entry → exit</th><th>Direction</th><th>Net</th></tr></thead><tbody>{#each backtest.trades as trade}<tr><td><strong>{trade.eventTitle}</strong><small>{trade.eventId}</small></td><td>{trade.signalDate}</td><td>{trade.entryDate} → {trade.exitDate}</td><td><span class:negative={trade.direction < 0}>{trade.direction > 0 ? "LONG" : "SHORT"}</span></td><td class:negative={trade.netReturn < 0}>{formatPercent(trade.netReturn)}</td></tr>{/each}</tbody></table></div>{:else}<div class="empty-state">No events meet this threshold and polarity combination.</div>{/if}</section>
	{:else}
		<section class="method-grid"><div class="card-base panel-pad"><span class="section-kicker">DATA PATH</span><h2>What is implemented</h2><div class="method-step"><strong>01</strong><div><h3>Collect &amp; normalize</h3><p>Fixture records preserve source URL, observed timestamp, category, entities, confidence and polarity. Exact URL duplicates are removed before clustering.</p></div></div><div class="method-step"><strong>02</strong><div><h3>Aggregate events</h3><p>Reports join when category, entities, time window and title similarity agree. A cluster keeps article IDs and source links rather than hiding disagreement.</p></div></div><div class="method-step"><strong>03</strong><div><h3>Rank for review</h3><p>Impact, source breadth, recency and coverage count create a transparent triage score. The score is not a prediction.</p></div></div><div class="method-step"><strong>04</strong><div><h3>Replay with guardrails</h3><p>Backtests use only information available at the event timestamp, enter on a later bar, and subtract configurable round-trip costs.</p></div></div></div><div class="card-base panel-pad"><span class="section-kicker">REVIEW BOUNDARY</span><h2>What stays private or unverified</h2><ul class="boundary-list"><li><strong>SQLite / FTS5</strong><span>The existing local knowledge path remains private. This public page ships a static fixture and a browser-side search seam; no private database is bundled.</span></li><li><strong>Collectors</strong><span>External collection and classification are not run in the browser. A production adapter must record fetch time, parser version and failure state.</span></li><li><strong>Model judgments</strong><span>Polarity and importance are review cues. They do not become measurements, verified outcomes or automated orders.</span></li><li><strong>Strategy claims</strong><span>Signal Lab demonstrates leakage-safe plumbing only. Synthetic performance must not be presented as investable evidence.</span></li></ul><div class="method-footer">Read the implementation review in <a href="/docs/ee-intelligence/PHASE-1-REVIEW.md">PHASE-1-REVIEW.md ↗</a></div></div></section>
	{/if}

	<footer class="ee-footer"><span>EE Intelligence · local-first review surface</span><span>Last fixture update 2026-09-28 · <a href="/posts/building-ee-intelligence-my-personal-engineering-ai-agent/">Read the project note ↗</a></span></footer>
</div>

<style>
	.ee-shell { width: min(1180px, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 3rem; color: var(--terminal-ink); }
	.card-base { border: 1px solid var(--terminal-line); border-radius: var(--radius-large); background: var(--terminal-surface); box-shadow: var(--terminal-shadow); }
	.ee-hero { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(14rem, .65fr); gap: 2rem; padding: clamp(1.3rem, 4vw, 2.6rem); overflow: hidden; position: relative; }
	.ee-hero::after { content: ""; position: absolute; inset: 0 0 auto; height: 2px; background: linear-gradient(90deg, var(--terminal-amber) 0 18%, var(--primary) 18% 42%, transparent 42%); }
	.eyebrow, .section-kicker { color: var(--terminal-amber); font: 700 .68rem/1.2 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }
	.hero-copy h1 { margin: .7rem 0 .8rem; font-size: clamp(2rem, 5vw, 4.15rem); line-height: .98; letter-spacing: -.055em; }
	.hero-copy h1 span { color: var(--primary); }
	.hero-copy p { max-width: 40rem; margin: 0; color: var(--content-meta); font-size: .95rem; line-height: 1.7; }
	.hero-badges { display: flex; gap: .45rem; flex-wrap: wrap; margin-top: 1.25rem; }
	.badge, .source-chip, .status-chip, .importance { border: 1px solid var(--terminal-line); border-radius: .18rem; padding: .35rem .5rem; font: 700 .64rem/1 ui-monospace, monospace; letter-spacing: .06em; }
	.badge-primary, .status-chip { border-color: color-mix(in srgb, var(--primary) 45%, transparent); background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
	.hero-telemetry { align-self: end; display: grid; grid-template-columns: repeat(3, 1fr); gap: .55rem; padding-top: 2.5rem; }
	.hero-telemetry div { border-left: 2px solid var(--terminal-line-strong); padding-left: .65rem; }
	.hero-telemetry span { display: block; color: var(--content-meta); font: 700 .58rem/1.2 ui-monospace, monospace; letter-spacing: .08em; }
	.hero-telemetry strong { display: block; margin-top: .25rem; font: 800 1.65rem/1 ui-monospace, monospace; color: var(--primary); }
	.hero-telemetry small { grid-column: 1/-1; color: var(--content-meta); font-size: .68rem; }
	.demo-notice { display: flex; gap: .8rem; margin: 1rem 0; padding: .8rem 1rem; border: 1px solid color-mix(in srgb, var(--terminal-amber) 50%, transparent); border-left: 3px solid var(--terminal-amber); background: var(--terminal-amber-soft); }
	.notice-mark { display: grid; width: 1.35rem; height: 1.35rem; flex: 0 0 auto; place-items: center; border: 1px solid var(--terminal-amber); color: var(--terminal-amber); font-weight: 800; }
	.demo-notice strong { font-size: .82rem; }.demo-notice p { margin: .2rem 0 0; color: var(--content-meta); font-size: .75rem; line-height: 1.5; }
	.mode-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: .45rem; margin: 1rem 0; }
	.mode-tab { display: grid; gap: .25rem; text-align: left; padding: .85rem 1rem; border: 1px solid var(--terminal-line); border-radius: .2rem; background: var(--terminal-surface-muted); color: var(--content-meta); cursor: pointer; }
	.mode-tab strong { font: 800 .72rem/1 ui-monospace, monospace; letter-spacing: .08em; }.mode-tab span { font-size: .72rem; }.mode-tab:hover, .mode-tab.active { border-color: var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 9%, transparent); }
	.toolbar { display: flex; align-items: center; gap: .7rem; padding: .7rem; margin-bottom: 1rem; }.search-field { display: flex; align-items: center; gap: .35rem; flex: 1; border: 1px solid var(--terminal-line); padding: .45rem .6rem; background: var(--terminal-surface-muted); }.search-field span { color: var(--primary); font-size: 1.1rem; }.search-field input { width: 100%; border: 0; outline: 0; background: transparent; color: inherit; font-size: .82rem; }.toolbar label, .field-grid label, .date-row label { display: grid; gap: .3rem; color: var(--content-meta); font-size: .68rem; }.toolbar select, .field-grid select, .date-row input, .field-grid input[type="date"] { border: 1px solid var(--terminal-line); border-radius: .15rem; padding: .5rem; background: var(--terminal-surface-muted); color: inherit; font-size: .75rem; }.toolbar-meta { color: var(--content-meta); font: .68rem ui-monospace, monospace; white-space: nowrap; }
	.event-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(18rem, .75fr); gap: 1rem; }.event-list, .event-detail { min-width: 0; }.event-list { padding: .25rem 0; }.section-heading { display: flex; justify-content: space-between; gap: .75rem; align-items: start; }.section-heading h2, .section-heading h3 { margin: .35rem 0 0; font-size: 1.25rem; letter-spacing: -.025em; }.section-heading.small { align-items: center; }.section-heading.small h3 { font-size: .88rem; }.section-heading.small span { color: var(--content-meta); font-size: .68rem; }.muted { color: var(--content-meta); font-size: .76rem; line-height: 1.55; }.event-card { display: grid; grid-template-columns: 2rem 1fr auto; width: 100%; gap: .7rem; margin-top: .55rem; padding: .85rem; border: 1px solid var(--terminal-line); border-left: 2px solid transparent; border-radius: .2rem; text-align: left; background: var(--terminal-surface); color: inherit; cursor: pointer; }.event-card:hover, .event-card.selected { border-color: var(--terminal-line-strong); border-left-color: var(--primary); background: var(--terminal-surface-muted); }.event-index { color: var(--content-meta); font: 700 .72rem ui-monospace, monospace; }.event-card-top { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }.importance { padding: .22rem .35rem; font-size: .58rem; }.importance.critical { border-color: #c25b5b; color: #c25b5b; }.importance.high { border-color: var(--terminal-amber); color: var(--terminal-amber); }.importance.watch { color: var(--content-meta); }.uncertainty-dot { width: .46rem; height: .46rem; border-radius: 50%; background: #63a27d; }.uncertainty-dot.medium { background: var(--terminal-amber); }.uncertainty-dot.high { background: #c25b5b; }.uncertainty-label { color: var(--content-meta); font-size: .63rem; }.event-card h3 { margin: .45rem 0 .25rem; font-size: .92rem; line-height: 1.25; }.event-card p { margin: 0; color: var(--content-meta); font-size: .73rem; line-height: 1.45; }.event-meta { display: flex; gap: .8rem; margin-top: .65rem; color: var(--content-meta); font: .63rem ui-monospace, monospace; }.event-arrow { color: var(--primary); font-size: 1.1rem; }.event-detail { position: sticky; top: 1rem; align-self: start; padding: 1.05rem; }.detail-top, .result-header { display: flex; justify-content: space-between; gap: .6rem; align-items: center; }.event-detail h2 { margin: .75rem 0 .45rem; font-size: 1.35rem; line-height: 1.15; }.event-detail > p { color: var(--content-meta); font-size: .78rem; line-height: 1.5; }.detail-row { display: flex; justify-content: space-between; gap: .7rem; padding: .65rem 0; border-bottom: 1px solid var(--terminal-line); color: var(--content-meta); font-size: .7rem; }.detail-row strong { color: inherit; font: 700 .68rem ui-monospace, monospace; }.uncertainty-text.medium { color: var(--terminal-amber); }.uncertainty-text.high { color: #c25b5b; }.uncertainty-box, .rule-callout { display: flex; gap: .55rem; margin: .85rem 0; padding: .7rem; background: var(--terminal-surface-muted); border-left: 2px solid var(--terminal-amber); }.uncertainty-box strong { font-size: .72rem; }.uncertainty-box ul { margin: .35rem 0 0; padding-left: .9rem; color: var(--content-meta); font-size: .68rem; line-height: 1.5; }.detail-section { margin-top: 1rem; }.evidence-row { display: grid; grid-template-columns: 3.4rem 1fr; gap: .5rem; padding: .55rem 0; border-bottom: 1px solid var(--terminal-line); }.evidence-row p { margin: 0; color: var(--content-meta); font-size: .7rem; line-height: 1.45; }.polarity { align-self: start; padding: .18rem .3rem; border: 1px solid var(--terminal-line); color: var(--content-meta); font: 700 .58rem ui-monospace, monospace; text-align: center; }.polarity.supports { border-color: #63a27d; color: #4a8a67; }.polarity.contradicts { border-color: #c25b5b; color: #b24f4f; }.polarity.mixed { border-color: var(--terminal-amber); color: var(--terminal-amber); }.source-row { display: flex; justify-content: space-between; gap: .5rem; padding: .55rem 0; border-bottom: 1px solid var(--terminal-line); color: inherit; text-decoration: none; font-size: .75rem; }.source-row:hover { color: var(--primary); }.source-row strong, .source-row small { display: block; }.source-row small { margin-top: .18rem; color: var(--content-meta); font: .6rem ui-monospace, monospace; }.empty-state { padding: 1.4rem; margin-top: .7rem; border: 1px dashed var(--terminal-line-strong); color: var(--content-meta); text-align: center; font-size: .78rem; }
	.signal-grid, .method-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(19rem, .85fr); gap: 1rem; }.panel-pad, .result-panel { padding: 1.1rem; }.field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; margin-top: 1.1rem; }.field-grid label { font-size: .72rem; }.field-grid strong { margin-left: auto; color: var(--primary); font: 700 .72rem ui-monospace, monospace; }.field-grid input[type="range"] { width: 100%; accent-color: var(--primary); }.range-value { float: right; }.date-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; margin-top: .8rem; }.date-row input { width: 100%; }.rule-callout { margin-top: 1rem; }.rule-callout > span { color: var(--primary); }.rule-callout strong { font-size: .73rem; }.rule-callout p { margin: .2rem 0 0; color: var(--content-meta); font-size: .68rem; line-height: 1.45; }.result-hero { margin: 1.2rem 0; padding: 1rem; border-left: 3px solid var(--primary); background: color-mix(in srgb, var(--primary) 8%, transparent); }.result-hero strong { display: block; color: var(--primary); font: 800 2.4rem/1 ui-monospace, monospace; }.result-hero span { color: var(--content-meta); font-size: .68rem; }.metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .6rem; }.metric-grid div { padding: .55rem; border: 1px solid var(--terminal-line); }.metric-grid span { display: block; color: var(--content-meta); font-size: .65rem; }.metric-grid strong { display: block; margin-top: .2rem; font: 700 .86rem ui-monospace, monospace; }.curve { margin-top: 1rem; }.curve-label { color: var(--content-meta); font: 700 .6rem ui-monospace, monospace; letter-spacing: .1em; }.curve-line { display: flex; gap: .16rem; height: 5rem; align-items: end; margin-top: .35rem; border-bottom: 1px solid var(--terminal-line-strong); }.curve-line i { min-width: .45rem; flex: 1; background: var(--primary); opacity: .7; }.curve-line i.down { background: #c25b5b; }.curve small { color: var(--content-meta); font-size: .62rem; }.result-disclaimer { margin: 1rem 0 0; color: var(--content-meta); font-size: .68rem; line-height: 1.45; }.trade-panel { margin-top: 1rem; }.table-wrap { overflow-x: auto; }.trade-panel table { width: 100%; margin-top: .75rem; border-collapse: collapse; font-size: .7rem; }.trade-panel th { color: var(--content-meta); font: 700 .6rem ui-monospace, monospace; letter-spacing: .07em; text-align: left; text-transform: uppercase; }.trade-panel td, .trade-panel th { padding: .6rem .45rem; border-bottom: 1px solid var(--terminal-line); white-space: nowrap; }.trade-panel td strong, .trade-panel td small { display: block; white-space: normal; max-width: 16rem; }.trade-panel td small { margin-top: .15rem; color: var(--content-meta); font: .6rem ui-monospace, monospace; }.negative { color: #b24f4f !important; }.method-step { display: grid; grid-template-columns: 2rem 1fr; gap: .65rem; margin-top: 1.1rem; }.method-step > strong { color: var(--primary); font: 700 .85rem ui-monospace, monospace; }.method-step h3 { margin: 0; font-size: .83rem; }.method-step p { margin: .2rem 0 0; color: var(--content-meta); font-size: .73rem; line-height: 1.5; }.boundary-list { display: grid; gap: .7rem; margin: 1rem 0; padding: 0; list-style: none; }.boundary-list li { display: grid; gap: .25rem; padding-bottom: .7rem; border-bottom: 1px solid var(--terminal-line); }.boundary-list strong { font-size: .76rem; }.boundary-list span { color: var(--content-meta); font-size: .72rem; line-height: 1.5; }.method-footer { color: var(--content-meta); font-size: .7rem; }.method-footer a, .ee-footer a { color: var(--primary); }.ee-footer { display: flex; justify-content: space-between; gap: .8rem; margin-top: 1.3rem; padding: .8rem 0; color: var(--content-meta); font: .65rem ui-monospace, monospace; }
	@media (max-width: 850px) { .ee-hero, .event-layout, .signal-grid, .method-grid { grid-template-columns: 1fr; }.hero-telemetry { padding-top: .4rem; }.event-detail { position: static; }.toolbar { align-items: stretch; flex-wrap: wrap; }.search-field { flex-basis: 100%; }.toolbar-meta { margin-left: auto; }.event-list { order: 1; }.event-detail { order: 2; } }
	@media (max-width: 560px) { .ee-shell { width: min(100% - 1rem, 1180px); padding-top: .65rem; }.ee-hero { padding: 1.1rem; }.hero-copy h1 { font-size: 2.25rem; }.hero-telemetry { gap: .3rem; }.hero-telemetry strong { font-size: 1.25rem; }.mode-tabs { gap: .25rem; }.mode-tab { padding: .7rem .55rem; }.mode-tab strong { font-size: .6rem; }.mode-tab span { font-size: .6rem; }.event-card { grid-template-columns: 1.5rem 1fr; }.event-arrow { display: none; }.event-meta { gap: .45rem; flex-wrap: wrap; }.field-grid, .date-row { grid-template-columns: 1fr; }.ee-footer { display: grid; }.demo-notice { padding: .7rem; } }
</style>
