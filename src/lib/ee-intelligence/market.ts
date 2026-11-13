import type { PriceBar } from "./types";

export interface MarketFetchResult {
	status: "ok" | "unavailable";
	symbol: string;
	prices: PriceBar[];
	error?: string;
	source: string;
}

interface YahooChartPayload {
	chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ open?: Array<number | null>; close?: Array<number | null> }>; adjclose?: Array<{ adjclose?: Array<number | null> }> } }> };
}

function stooqSymbol(symbol: string): string {
	return `${symbol.toLowerCase().replace(/[^a-z0-9.-]/g, "")}.us`;
}

export function parseStooqCsv(csv: string, symbol: string): PriceBar[] {
	const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	if (!lines.length || !/^date,?open/i.test(lines[0] ?? "")) return [];
	return lines.slice(1).flatMap((line) => {
		const [date, open, , , close] = line.split(",");
		const parsedOpen = Number(open);
		const parsedClose = Number(close);
		if (!date || !Number.isFinite(parsedOpen) || !Number.isFinite(parsedClose) || parsedClose <= 0) return [];
		return [{ date, symbol, open: parsedOpen, close: parsedClose }];
	});
}

export function parseYahooChart(payload: YahooChartPayload, symbol: string): PriceBar[] {
	const result = payload.chart?.result?.[0];
	const timestamps = result?.timestamp ?? [];
	const quote = result?.indicators?.quote?.[0];
	const adjusted = result?.indicators?.adjclose?.[0]?.adjclose;
	return timestamps.flatMap((timestamp, index) => {
		const open = quote?.open?.[index];
		const close = adjusted?.[index] ?? quote?.close?.[index];
		if (!Number.isFinite(timestamp) || !Number.isFinite(open) || !Number.isFinite(close) || close === null || open === null) return [];
		return [{ date: new Date(timestamp * 1000).toISOString().slice(0, 10), symbol, open: Number(open), close: Number(close) }];
	});
}

export async function fetchYahooHistory(symbol: string, start: string, end: string, fetcher: typeof fetch = fetch): Promise<MarketFetchResult> {
	const normalized = symbol.toUpperCase();
	const period1 = Math.floor(new Date(`${start}T00:00:00Z`).getTime() / 1000);
	const period2 = Math.floor(new Date(`${end}T23:59:59Z`).getTime() / 1000);
	const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
	try {
		const response = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "SoraMax EE Intelligence public reader/2.0 (+https://soramax.xyz)" }, signal: AbortSignal.timeout(12_000) });
		if (!response.ok) return { status: "unavailable", symbol: normalized, prices: [], error: `HTTP ${response.status}`, source: "Yahoo Finance chart API" };
		const prices = parseYahooChart(await response.json() as YahooChartPayload, normalized);
		return prices.length ? { status: "ok", symbol: normalized, prices, source: "Yahoo Finance chart API" } : { status: "unavailable", symbol: normalized, prices: [], error: "No usable bars returned", source: "Yahoo Finance chart API" };
	} catch (error) {
		return { status: "unavailable", symbol: normalized, prices: [], error: error instanceof Error ? error.message : "Network error", source: "Yahoo Finance chart API" };
	}
}

export async function fetchPublicHistory(symbol: string, start: string, end: string, fetcher: typeof fetch = fetch): Promise<MarketFetchResult> {
	const yahoo = await fetchYahooHistory(symbol, start, end, fetcher);
	if (yahoo.status === "ok") return yahoo;
	const stooq = await fetchStooqHistory(symbol, start, end, fetcher);
	if (stooq.status === "ok") return stooq;
	return { status: "unavailable", symbol: symbol.toUpperCase(), prices: [], error: `${yahoo.source}: ${yahoo.error}; ${stooq.source}: ${stooq.error}`, source: "Yahoo Finance chart API + Stooq daily CSV" };
}

export async function fetchStooqHistory(symbol: string, start: string, end: string, fetcher: typeof fetch = fetch): Promise<MarketFetchResult> {
	const normalized = symbol.toUpperCase();
	const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol(normalized))}&i=d&d1=${encodeURIComponent(start.replaceAll("-", ""))}&d2=${encodeURIComponent(end.replaceAll("-", ""))}`;
	try {
		const response = await fetcher(url, { headers: { Accept: "text/csv", "User-Agent": "SoraMax EE Intelligence public reader/2.0 (+https://soramax.xyz)" }, signal: AbortSignal.timeout(12_000) });
		if (!response.ok) return { status: "unavailable", symbol: normalized, prices: [], error: `HTTP ${response.status}`, source: "Stooq daily CSV" };
		const prices = parseStooqCsv(await response.text(), normalized);
		return prices.length ? { status: "ok", symbol: normalized, prices, source: "Stooq daily CSV" } : { status: "unavailable", symbol: normalized, prices: [], error: "No usable bars returned", source: "Stooq daily CSV" };
	} catch (error) {
		return { status: "unavailable", symbol: normalized, prices: [], error: error instanceof Error ? error.message : "Network error", source: "Stooq daily CSV" };
	}
}
