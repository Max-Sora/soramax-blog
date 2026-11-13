import assert from "node:assert/strict";
import test from "node:test";
import {
	aggregateEvents,
	deduplicateNews,
	runBacktest,
	searchNews,
	titleSimilarity,
} from "./engine";
import { demoNews, demoPrices, demoSources } from "./fixtures";

test("removes exact URL duplicates before aggregation", () => {
	const result = deduplicateNews([
		...demoNews,
		{ ...demoNews[0]!, id: "duplicate-copy" },
	]);
	assert.equal(result.duplicatesRemoved, 1);
	assert.equal(result.items.length, demoNews.length);
});

test("clusters paraphrased reports for one event and preserves evidence polarity", () => {
	const events = aggregateEvents(demoNews, demoSources);
	const policy = events.find((event) => event.category === "policy");
	assert.ok(policy);
	assert.ok(policy.sources.length >= 2);
	assert.ok(
		policy.evidence.some((evidence) => evidence.polarity === "supports"),
	);
	assert.ok(policy.evidence.some((evidence) => evidence.polarity === "mixed"));
	assert.equal(policy.uncertainty, "medium");
});

test("uses text search over the demo corpus", () => {
	assert.equal(searchNews(demoNews, "thermal").length, 2);
	assert.ok(
		titleSimilarity(
			"Draft export review could slow shipments",
			"Bulletin controller export review remains under consultation",
		) > 0.15,
	);
});

test("enters strictly after publication and subtracts round-trip costs", () => {
	const events = aggregateEvents(demoNews, demoSources);
	const result = runBacktest(events, demoPrices, {
		symbol: "SIM-EE",
		start: "2026-09-07",
		end: "2026-09-25",
		importanceThreshold: 45,
		costBps: 25,
		holdingDays: 2,
	});
	assert.equal(result.status, "simulated");
	assert.equal(result.noLookahead, true);
	assert.ok(result.trades.length > 0);
	assert.ok(result.totalCosts > 0);
	assert.ok(result.trades.every((trade) => trade.entryDate > trade.signalDate));
});
