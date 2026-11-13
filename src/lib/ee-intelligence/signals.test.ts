import assert from "node:assert/strict";
import test from "node:test";
import { aggregateEvents } from "./engine";
import { demoNews, demoSources } from "./fixtures";
import { deriveResearchSignals } from "./signals";

test("explains synthetic signal direction from deduplicated event evidence", () => {
	const signals = deriveResearchSignals(aggregateEvents(demoNews, demoSources));
	const nvidia = signals.find((signal) => signal.company.ticker === "NVDA");
	assert.ok(nvidia);
	assert.equal(nvidia.dataMode, "synthetic");
	assert.ok(["bullish", "bearish", "neutral", "insufficient_data"].includes(nvidia.direction));
	assert.ok(nvidia.facts.length > 0);
	assert.ok(nvidia.inferences.length > 0);
	assert.ok(nvidia.eventIds.length > 0);
});

test("does not manufacture a ticker when event companies are unknown", () => {
	const unknown = aggregateEvents([{ ...demoNews[0]!, id: "unknown-company", companies: [], dataMode: "live" }], demoSources);
	assert.equal(deriveResearchSignals(unknown).length, 0);
});
