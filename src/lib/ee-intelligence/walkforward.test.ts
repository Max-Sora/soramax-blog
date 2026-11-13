import assert from "node:assert/strict";
import test from "node:test";
import { aggregateEvents } from "./engine";
import { demoNews, demoPrices, demoSources } from "./fixtures";
import { runWalkForward } from "./walkforward";

test("walk-forward result keeps an out-of-sample window explicit", () => {
	const events = aggregateEvents(demoNews, demoSources);
	const result = runWalkForward(events, demoPrices, { symbol: "SIM-EE", start: "2026-09-07", end: "2026-09-25", importanceThreshold: 35, costBps: 25, slippageBps: 10, signalDelayBars: 1, holdingDays: 2 }, "synthetic");
	assert.equal(result.mode, "synthetic");
	assert.equal(result.folds.length, 1);
	assert.ok(result.folds[0]?.testStart);
	assert.ok(result.folds[0]?.result.trades.every((trade) => trade.entryDate > trade.signalDate));
});
