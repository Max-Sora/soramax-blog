import type { CompanyRef, LiveSnapshot, NewsItem, NewsSource } from "./types";

export interface PublicFeedConfig {
	id: string;
	name: string;
	url: string;
	tier: NewsSource["tier"];
	category: NewsItem["category"];
	maxItems: number;
}

export const PUBLIC_FEEDS: PublicFeedConfig[] = [
	{ id: "the-verge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", tier: "secondary", category: "market", maxItems: 12 },
	{ id: "ars-technica", name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", tier: "specialist", category: "research", maxItems: 12 },
	{ id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/", tier: "secondary", category: "company", maxItems: 12 },
	{ id: "sec-press", name: "U.S. SEC Press Releases", url: "https://www.sec.gov/news/pressreleases.rss", tier: "primary", category: "policy", maxItems: 12 },
];

export interface ParsedFeed {
	items: NewsItem[];
	sources: NewsSource[];
}

const COMPANY_DIRECTORY: CompanyRef[] = [
	{ name: "NVIDIA", ticker: "NVDA", aliases: ["nvidia", "nvda", "geforce", "cuda"] },
	{ name: "AMD", ticker: "AMD", aliases: ["amd", "advanced micro devices", "ryzen", "epyc"] },
	{ name: "Intel", ticker: "INTC", aliases: ["intel", "intc", "xeon", "foundry"] },
	{ name: "Taiwan Semiconductor", ticker: "TSM", aliases: ["tsmc", "taiwan semiconductor", "tsm"] },
	{ name: "ASML", ticker: "ASML", aliases: ["asml", "euv"] },
	{ name: "Microsoft", ticker: "MSFT", aliases: ["microsoft", "msft", "azure"] },
	{ name: "Apple", ticker: "AAPL", aliases: ["apple", "aapl", "iphone"] },
	{ name: "Amazon", ticker: "AMZN", aliases: ["amazon", "amzn", "aws"] },
	{ name: "Alphabet", ticker: "GOOGL", aliases: ["google", "alphabet", "googl"] },
	{ name: "Meta", ticker: "META", aliases: ["meta", "facebook", "instagram"] },
	{ name: "Tesla", ticker: "TSLA", aliases: ["tesla", "tsla"] },
];

function decodeEntities(value: string): string {
	return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code))).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string): string {
	const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
	return decodeEntities(match?.[1] ?? "");
}

function extractLink(block: string): string {
	const atom = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
	if (atom) return decodeEntities(atom);
	return extractTag(block, "link") || extractTag(block, "guid");
}

function blocksFor(xml: string): string[] {
	const rss = [...xml.matchAll(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi)].map((match) => match[0]);
	return rss.length ? rss : [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
}

function canonicalUrl(value: string): string {
	try {
		const url = new URL(value);
		url.hash = "";
		for (const key of [...url.searchParams.keys()]) if (/^(utm_|ref|source|output)/i.test(key)) url.searchParams.delete(key);
		return url.toString();
	} catch {
		return value.trim();
	}
}

function hash(value: string): string {
	let result = 2166136261;
	for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
	return (result >>> 0).toString(16);
}

function companyMatches(text: string): CompanyRef[] {
	const lower = text.toLowerCase();
	return COMPANY_DIRECTORY.filter((company) => company.aliases.some((alias) => lower.includes(alias))).map((company) => ({ ...company, aliases: [...company.aliases] }));
}

function classify(text: string, fallback: NewsItem["category"]): { category: NewsItem["category"]; impact: number; polarity: NewsItem["polarity"]; confidence: number } {
	const lower = text.toLowerCase();
	const category = /chip|semiconductor|gpu|foundry|fabrication|euv|processor|hardware/.test(lower) ? "supply" : /earnings|revenue|shares|stock|forecast|demand|market/.test(lower) ? "market" : /research|study|model|benchmark|algorithm|science/.test(lower) ? "research" : /regulator|sec|rule|policy|ban|export|antitrust|law/.test(lower) ? "policy" : fallback;
	const positive = /beats|raises|growth|strong|wins|launch|approval|record|expands|surge|breakthrough|demand/.test(lower);
	const negative = /cuts|miss|delay|probe|recall|weak|decline|lawsuit|ban|outage|layoff|warning/.test(lower);
	const polarity = positive && negative ? "mixed" : positive ? "supports" : negative ? "contradicts" : "unknown";
	const impact = Math.min(0.95, 0.38 + (companyMatches(text).length ? 0.18 : 0) + (positive || negative ? 0.12 : 0) + (/chip|gpu|ai|semiconductor|sec|regulator/.test(lower) ? 0.16 : 0));
	return { category, impact, polarity, confidence: polarity === "unknown" ? 0.35 : 0.52 };
}

export function parsePublicFeed(xml: string, feed: PublicFeedConfig, observedAt = new Date().toISOString()): ParsedFeed {
	const items: NewsItem[] = [];
	const sources: NewsSource[] = [];
	for (const block of blocksFor(xml).slice(0, feed.maxItems)) {
		const title = extractTag(block, "title");
		const url = canonicalUrl(extractLink(block));
		if (!title || !url) continue;
		const publishedAt = extractTag(block, "pubDate") || extractTag(block, "published") || extractTag(block, "updated") || observedAt;
		const parsedDate = new Date(publishedAt);
		const publishedIso = Number.isNaN(parsedDate.getTime()) ? observedAt : parsedDate.toISOString();
		const summary = extractTag(block, "description") || extractTag(block, "summary") || extractTag(block, "content:encoded") || title;
		const text = `${title} ${summary}`;
		const classification = classify(text, feed.category);
		const companies = companyMatches(text);
		const guid = extractTag(block, "guid") || url;
		const dedupeKey = `${feed.id}:${hash(`${guid}|${publishedIso.slice(0, 10)}|${title.toLowerCase()}`)}`;
		const itemId = `${feed.id}-${hash(url)}`;
		const source: NewsSource = { id: `${feed.id}-${hash(url)}`, name: feed.name, url, tier: feed.tier, publishedAt: publishedIso, observedAt, excerpt: summary.slice(0, 240), isSimulated: false, feedUrl: feed.url };
		sources.push(source);
		items.push({ id: itemId, sourceId: source.id, title, summary: summary.slice(0, 420), body: summary, url, publishedAt: publishedIso, category: classification.category, entities: companies.flatMap((company) => [company.name, ...(company.ticker ? [company.ticker] : [])]), impact: classification.impact, polarity: classification.polarity, confidence: classification.confidence, guid, firstSeenAt: observedAt, dedupeKey, companies, dataMode: "live", freshnessStatus: freshnessStatus(publishedIso, observedAt) });
	}
	return { items, sources };
}

export function freshnessStatus(publishedAt: string, now = new Date().toISOString(), maxAgeHours = 72): "fresh" | "stale" | "unknown" {
	const timestamp = new Date(publishedAt).getTime();
	const current = new Date(now).getTime();
	if (Number.isNaN(timestamp) || Number.isNaN(current)) return "unknown";
	return current - timestamp <= maxAgeHours * 60 * 60 * 1000 ? "fresh" : "stale";
}

export function unavailableLiveSnapshot(message: string): LiveSnapshot {
	return { mode: "live", status: "unavailable", fetchedAt: new Date().toISOString(), items: [], sources: [], errors: [message], reusedCacheCount: 0, freshnessHours: null };
}

export { COMPANY_DIRECTORY };
