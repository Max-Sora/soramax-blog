import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import test from "node:test";
import { collectLiveSnapshot } from "./collector";

test("collector uses cached XML when a public feed temporarily fails", async () => {
	const feed = {
		id: "test-feed",
		name: "Test Feed",
		url: "https://example.com/feed.xml",
		tier: "specialist" as const,
		category: "research" as const,
		maxItems: 10,
	};
	const root = `${process.cwd()}\\cache\\ee-intelligence-test`;
	const snapshotPath = `${process.cwd()}\\src\\data\\ee-intelligence\\test-snapshot.json`;
	const fetcher = async () =>
		new Response(
			`<?xml version="1.0"?><rss><channel><item><guid>one</guid><title>AMD launches a new accelerator</title><link>https://example.com/one</link><pubDate>Mon, 10 Nov 2026 12:00:00 GMT</pubDate><description>Strong demand.</description></item></channel></rss>`,
			{ status: 200, headers: { etag: "one" } },
		);
	const first = await collectLiveSnapshot({
		feeds: [feed],
		cacheDir: root,
		snapshotPath,
		fetcher,
		now: "2026-11-10T13:00:00Z",
	});
	assert.equal(first.items.length, 1);
	assert.equal(first.items[0]?.firstSeenAt, "2026-11-10T13:00:00Z");
	const second = await collectLiveSnapshot({
		feeds: [feed],
		cacheDir: root,
		snapshotPath,
		fetcher: async () => {
			throw new Error("offline");
		},
		now: "2026-11-10T14:00:00Z",
	});
	assert.equal(second.items.length, 1);
	assert.equal(second.reusedCacheCount, 1);
	assert.equal(second.items[0]?.firstSeenAt, "2026-11-10T13:00:00Z");
	await rm(root, { recursive: true, force: true });
	await rm(snapshotPath, { force: true });
});
