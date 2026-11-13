import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { PUBLIC_FEEDS, type PublicFeedConfig, parsePublicFeed } from "./live";
import type { LiveSnapshot, NewsItem, NewsSource } from "./types";

interface FeedCacheRecord {
	feedId: string;
	fetchedAt: string;
	etag?: string;
	lastModified?: string;
	xml: string;
	firstSeenByKey?: Record<string, string>;
}

export interface CollectorOptions {
	feeds?: PublicFeedConfig[];
	cacheDir?: string;
	snapshotPath?: string;
	fetcher?: typeof fetch;
	now?: string;
}

export async function readFeedCache(
	cacheDir: string,
	feedId: string,
): Promise<FeedCacheRecord | null> {
	try {
		return JSON.parse(
			await readFile(join(cacheDir, `${feedId}.json`), "utf8"),
		) as FeedCacheRecord;
	} catch {
		return null;
	}
}

export async function collectLiveSnapshot(
	options: CollectorOptions = {},
): Promise<LiveSnapshot> {
	const feeds = options.feeds ?? PUBLIC_FEEDS;
	const cacheDir =
		options.cacheDir ?? join(process.cwd(), "cache", "ee-intelligence");
	const snapshotPath =
		options.snapshotPath ??
		join(process.cwd(), "src", "data", "ee-intelligence", "live-snapshot.json");
	const fetcher = options.fetcher ?? fetch;
	const observedAt = options.now ?? new Date().toISOString();
	const items: NewsItem[] = [];
	const sources: NewsSource[] = [];
	const errors: string[] = [];
	let reusedCacheCount = 0;
	await mkdir(cacheDir, { recursive: true });
	for (const feed of feeds) {
		const previous = await readFeedCache(cacheDir, feed.id);
		try {
			const headers: Record<string, string> = {
				Accept:
					"application/rss+xml, application/atom+xml, application/xml, text/xml",
				"User-Agent":
					"SoraMax EE Intelligence public reader/2.0 (+https://soramax.xyz)",
			};
			if (previous?.etag) headers["If-None-Match"] = previous.etag;
			if (previous?.lastModified)
				headers["If-Modified-Since"] = previous.lastModified;
			const response = await fetcher(feed.url, {
				headers,
				signal: AbortSignal.timeout(12_000),
			});
			let xml = "";
			if (response.status === 304 && previous) {
				xml = previous.xml;
				reusedCacheCount += 1;
			} else if (response.ok) {
				xml = await response.text();
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
			if (!xml) throw new Error("empty response");
			const parsed = parsePublicFeed(xml, feed, observedAt);
			const firstSeenByKey = { ...(previous?.firstSeenByKey ?? {}) };
			for (const item of parsed.items) {
				const key = item.dedupeKey ?? item.id;
				item.firstSeenAt = firstSeenByKey[key] ?? observedAt;
				firstSeenByKey[key] = item.firstSeenAt;
			}
			items.push(...parsed.items);
			sources.push(...parsed.sources);
			await writeFile(
				join(cacheDir, `${feed.id}.json`),
				JSON.stringify(
					{
						feedId: feed.id,
						fetchedAt: observedAt,
						etag: response.headers.get("etag") ?? previous?.etag,
						lastModified:
							response.headers.get("last-modified") ?? previous?.lastModified,
						firstSeenByKey,
						xml,
					},
					null,
					2,
				),
			);
		} catch (error) {
			if (previous?.xml) {
				const parsed = parsePublicFeed(previous.xml, feed, previous.fetchedAt);
				for (const item of parsed.items)
					item.firstSeenAt =
						previous.firstSeenByKey?.[item.dedupeKey ?? item.id] ??
						previous.fetchedAt;
				items.push(...parsed.items);
				sources.push(...parsed.sources);
				reusedCacheCount += 1;
				errors.push(
					`${feed.name}: live fetch failed; reused cached snapshot (${error instanceof Error ? error.message : "unknown error"})`,
				);
			} else {
				errors.push(
					`${feed.name}: ${error instanceof Error ? error.message : "unknown error"}`,
				);
			}
		}
	}
	const freshnessHours = items.length
		? Math.max(
				...items
					.map(
						(item) =>
							(Date.parse(observedAt) - Date.parse(item.publishedAt)) /
							3_600_000,
					)
					.filter(Number.isFinite),
			)
		: null;
	const snapshot: LiveSnapshot = {
		mode: "live",
		status:
			items.length === 0
				? "unavailable"
				: freshnessHours !== null && freshnessHours <= 72
					? "fresh"
					: "stale",
		fetchedAt: observedAt,
		items,
		sources,
		errors,
		reusedCacheCount,
		freshnessHours,
	};
	await mkdir(dirname(snapshotPath), { recursive: true });
	await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
	return snapshot;
}
