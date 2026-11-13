import assert from "node:assert/strict";
import test from "node:test";
import { fetchStooqHistory, fetchYahooHistory, parseStooqCsv, parseYahooChart } from "./market";

test("parses public daily CSV without inventing missing bars", () => {
	const bars = parseStooqCsv("Date,Open,High,Low,Close,Volume\n2026-01-02,100,102,99,101,10\n2026-01-03,NA,NA,NA,NA,0\n2026-01-04,101,103,100,102,12\n", "NVDA");
	assert.deepEqual(bars.map((bar) => bar.date), ["2026-01-02", "2026-01-04"]);
	assert.equal(bars[0]?.symbol, "NVDA");
});

test("returns an explicit unavailable state on market fetch failure", async () => {
	const result = await fetchStooqHistory("NVDA", "2026-01-01", "2026-01-10", async () => new Response("", { status: 503 }));
	assert.equal(result.status, "unavailable");
	assert.equal(result.prices.length, 0);
});

test("parses adjusted Yahoo chart bars and uses the public endpoint", async () => {
	const payload = { chart: { result: [{ timestamp: [1767355200, 1767441600], indicators: { quote: [{ open: [100, 101], close: [101, 102] }], adjclose: [{ adjclose: [100.5, 101.5] }] } }] } };
	const bars = parseYahooChart(payload, "NVDA");
	assert.equal(bars.length, 2);
	assert.equal(bars[0]?.close, 100.5);
	const result = await fetchYahooHistory("NVDA", "2026-01-01", "2026-01-10", async () => new Response(JSON.stringify(payload), { status: 200 }));
	assert.equal(result.status, "ok");
});
