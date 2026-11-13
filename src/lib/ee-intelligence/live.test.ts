import assert from "node:assert/strict";
import test from "node:test";
import { freshnessStatus, parsePublicFeed } from "./live";

const feed = { id: "demo-feed", name: "Demo Public Feed", url: "https://example.com/feed.xml", tier: "specialist" as const, category: "research" as const, maxItems: 10 };

test("parses RSS and creates provenance-linked live records", () => {
	const result = parsePublicFeed(`<?xml version="1.0"?><rss><channel><item><guid>abc</guid><title>NVIDIA launches a stronger AI accelerator</title><link>https://news.example/item?utm_source=rss</link><pubDate>Mon, 10 Nov 2026 12:00:00 GMT</pubDate><description><![CDATA[Company growth and new GPU demand.]]></description></item></channel></rss>`, feed, "2026-11-10T13:00:00.000Z");
	assert.equal(result.items.length, 1);
	assert.equal(result.items[0]?.dataMode, "live");
	assert.equal(result.items[0]?.companies?.[0]?.ticker, "NVDA");
	assert.equal(result.items[0]?.polarity, "supports");
	assert.equal(result.sources[0]?.feedUrl, feed.url);
	assert.equal(result.items[0]?.url, "https://news.example/item");
});

test("marks old records stale instead of hiding freshness", () => {
	assert.equal(freshnessStatus("2026-11-10T00:00:00Z", "2026-11-10T12:00:00Z"), "fresh");
	assert.equal(freshnessStatus("2026-10-01T00:00:00Z", "2026-11-10T12:00:00Z"), "stale");
	assert.equal(freshnessStatus("unknown", "2026-11-10T12:00:00Z"), "unknown");
});
