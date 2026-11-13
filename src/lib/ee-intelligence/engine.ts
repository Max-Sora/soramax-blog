import type {
	BacktestConfig,
	BacktestResult,
	BacktestTrade,
	EventCluster,
	NewsItem,
	NewsSource,
	PriceBar,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function tokenSet(value: string): Set<string> {
	return new Set(normalizeText(value).split(" ").filter((token) => token.length > 2));
}

export function titleSimilarity(left: string, right: string): number {
	const a = tokenSet(left);
	const b = tokenSet(right);
	if (a.size === 0 || b.size === 0) return 0;
	const intersection = [...a].filter((token) => b.has(token)).length;
	return intersection / (a.size + b.size - intersection);
}

export function deduplicateNews(items: NewsItem[]): { items: NewsItem[]; duplicatesRemoved: number } {
	const seenIds = new Set<string>();
	const seenUrls = new Set<string>();
	const unique: NewsItem[] = [];
	for (const item of items) {
		const urlKey = normalizeText(item.url);
		if (seenIds.has(item.id) || (urlKey && seenUrls.has(urlKey))) continue;
		seenIds.add(item.id);
		if (urlKey) seenUrls.add(urlKey);
		unique.push(item);
	}
	return { items: unique, duplicatesRemoved: items.length - unique.length };
}

function hoursApart(left: string, right: string): number {
	return Math.abs(new Date(left).getTime() - new Date(right).getTime()) / (DAY_MS / 24);
}

function overlap(left: string[], right: string[]): number {
	const a = new Set(left);
	const b = new Set(right);
	return [...a].filter((value) => b.has(value)).length;
}

function importanceLabel(score: number): EventCluster["importanceLabel"] {
	return score >= 75 ? "critical" : score >= 52 ? "high" : "watch";
}

function sourceWeight(source: NewsSource | undefined): number {
	if (!source) return 0.45;
	return source.tier === "primary" ? 1 : source.tier === "specialist" ? 0.9 : source.tier === "secondary" ? 0.72 : 0.6;
}

export function aggregateEvents(items: NewsItem[], sources: NewsSource[], now = "2026-09-28"): EventCluster[] {
	const { items: unique } = deduplicateNews(items);
	const parent = unique.map((_, index) => index);
	const find = (index: number): number => {
		if (parent[index] === index) return index;
		parent[index] = find(parent[index]!);
		return parent[index]!;
	};
	const join = (left: number, right: number) => {
		const a = find(left);
		const b = find(right);
		if (a !== b) parent[b] = a;
	};
	for (let left = 0; left < unique.length; left += 1) {
		for (let right = left + 1; right < unique.length; right += 1) {
			const a = unique[left]!;
			const b = unique[right]!;
			const sameTopic = a.category === b.category && overlap(a.entities, b.entities) > 0;
			if (sameTopic && hoursApart(a.publishedAt, b.publishedAt) <= 72 && titleSimilarity(a.title, b.title) >= 0.22) join(left, right);
		}
	}
	const grouped = new Map<number, NewsItem[]>();
	unique.forEach((item, index) => {
		const key = find(index);
		const bucket = grouped.get(key) ?? [];
		bucket.push(item);
		grouped.set(key, bucket);
	});
	return [...grouped.values()].map((articles, index) => {
		const sorted = [...articles].sort((a, b) => b.impact * b.confidence - a.impact * a.confidence);
		const first = sorted[0]!;
		const eventSources = [...new Map(articles
			.map((article) => sources.find((source) => source.id === article.sourceId))
			.filter((source): source is NewsSource => Boolean(source))
			.map((source) => [source.id, source] as const)).values()];
		const meanImpact = articles.reduce((sum, article) => sum + article.impact * 100, 0) / articles.length;
		const sourceBreadth = Math.min(1, eventSources.length / 3);
		const recency = Math.max(0, 1 - (new Date(now).getTime() - new Date(first.publishedAt).getTime()) / (DAY_MS * 30));
		const score = Math.round(Math.min(99, meanImpact * 0.56 + sourceBreadth * 18 + recency * 12 + Math.min(12, articles.length * 3)));
		const polarities = new Set(articles.map((article) => article.polarity));
		const reasons: string[] = [];
		if (eventSources.length < 2) reasons.push("单一来源，等待交叉验证");
		if (polarities.has("mixed") || (polarities.has("supports") && polarities.has("contradicts"))) reasons.push("存在正反证据");
		if (articles.some((article) => article.confidence < 0.5)) reasons.push("至少一条记录置信度较低");
		const uncertainty = reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low";
		const evidence = [...new Set(articles.map((article) => article.polarity))].map((polarity) => ({
			polarity,
			statement: articles.filter((article) => article.polarity === polarity).map((article) => article.summary).join(" "),
			sourceIds: articles.filter((article) => article.polarity === polarity).map((article) => article.sourceId),
		}));
		return {
			id: `event-${index + 1}`,
			title: first.title,
			category: first.category,
			occurredAt: articles.map((article) => article.publishedAt).sort()[0]!,
			summary: first.summary,
			importanceScore: score,
			importanceLabel: importanceLabel(score),
			articleIds: articles.map((article) => article.id),
			sources: eventSources,
			evidence,
			uncertainty,
			uncertaintyReasons: reasons,
		};
	});
}

export function rankEvents(events: EventCluster[]): EventCluster[] {
	return [...events].sort((left, right) => right.importanceScore - left.importanceScore || right.sources.length - left.sources.length);
}

export function searchNews(items: NewsItem[], query: string): NewsItem[] {
	const tokens = [...tokenSet(query)];
	if (tokens.length === 0) return items;
	return items
		.map((item) => {
			const haystack = tokenSet(`${item.title} ${item.summary} ${item.body} ${item.entities.join(" ")}`);
			const score = tokens.filter((token) => haystack.has(token)).length;
			return { item, score };
		})
		.filter(({ score }) => score > 0)
		.sort((left, right) => right.score - left.score)
		.map(({ item }) => item);
}

function directionFor(event: EventCluster): 1 | -1 | null {
	const polarities = event.evidence.map((evidence) => evidence.polarity);
	if (polarities.includes("mixed") || polarities.includes("unknown") || (polarities.includes("supports") && polarities.includes("contradicts"))) return null;
	if (polarities.includes("contradicts")) return -1;
	if (polarities.includes("supports")) return 1;
	return null;
}

export function runBacktest(events: EventCluster[], prices: PriceBar[], config: BacktestConfig): BacktestResult {
	const bars = prices.filter((bar) => bar.symbol === config.symbol && bar.date >= config.start && bar.date <= config.end).sort((a, b) => a.date.localeCompare(b.date));
	const trades: BacktestTrade[] = [];
	const violations: string[] = [];
	let lastExit = "";
	for (const event of rankEvents(events).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) {
		if (event.importanceScore < config.importanceThreshold) continue;
		const direction = directionFor(event);
		if (!direction) continue;
		const entryIndex = bars.findIndex((bar) => bar.date > event.occurredAt && (!lastExit || bar.date > lastExit));
		if (entryIndex < 0) continue;
		const exitIndex = Math.min(bars.length - 1, entryIndex + Math.max(1, config.holdingDays));
		if (exitIndex <= entryIndex) continue;
		const entry = bars[entryIndex]!;
		const exit = bars[exitIndex]!;
		if (entry.date <= event.occurredAt) violations.push(`${event.id}: entry ${entry.date} is not after signal ${event.occurredAt}`);
		const grossReturn = direction * ((exit.close - entry.close) / entry.close);
		const transactionCost = (Math.max(0, config.costBps) / 10000) * 2;
		trades.push({
			eventId: event.id,
			eventTitle: event.title,
			direction,
			signalDate: event.occurredAt,
			entryDate: entry.date,
			exitDate: exit.date,
			entryPrice: entry.close,
			exitPrice: exit.close,
			grossReturn,
			transactionCost,
			netReturn: grossReturn - transactionCost,
		});
		lastExit = exit.date;
	}
	let value = 1;
	let peak = 1;
	let maxDrawdown = 0;
	const equityCurve: BacktestResult["equityCurve"] = [{ date: config.start, value }];
	for (const trade of trades) {
		value *= 1 + trade.netReturn;
		peak = Math.max(peak, value);
		maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak);
		equityCurve.push({ date: trade.exitDate, value });
	}
	return {
		config,
		trades,
		totalReturn: value - 1,
		totalCosts: trades.reduce((sum, trade) => sum + trade.transactionCost, 0),
		winRate: trades.length ? trades.filter((trade) => trade.netReturn > 0).length / trades.length : 0,
		maxDrawdown,
		noLookahead: violations.length === 0,
		lookaheadViolations: violations,
		equityCurve,
		status: "simulated",
	};
}

export function sourceById(sources: NewsSource[], id: string): NewsSource | undefined {
	return sources.find((source) => source.id === id);
}

export function sourceTierLabel(source: NewsSource): string {
	return source.isSimulated ? "SIMULATED" : source.tier.toUpperCase();
}

export { sourceWeight };
