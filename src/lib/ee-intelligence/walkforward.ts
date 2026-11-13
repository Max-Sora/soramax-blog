import { runBacktest } from "./engine";
import type {
	BacktestConfig,
	DataMode,
	EventCluster,
	PriceBar,
	WalkForwardFold,
	WalkForwardResult,
} from "./types";

function benchmarkReturn(
	prices: PriceBar[],
	start: string,
	end: string,
): number | null {
	const bars = prices
		.filter((bar) => bar.date >= start && bar.date <= end)
		.sort((a, b) => a.date.localeCompare(b.date));
	if (bars.length < 2) return null;
	return bars[bars.length - 1]!.close / bars[0]!.close - 1;
}

export function runWalkForward(
	events: EventCluster[],
	prices: PriceBar[],
	config: BacktestConfig,
	mode: DataMode,
): WalkForwardResult {
	if (events.length < 2 || prices.length < 4)
		return {
			status: "insufficient_data",
			mode,
			folds: [],
			combinedReturn: null,
			benchmarkReturn: null,
			message: "需要至少两个事件和四个价格 bar 才能执行样本外验证。",
		};
	const dates = [...events]
		.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
		.map((event) => event.occurredAt);
	const split = dates[Math.max(0, Math.floor(dates.length / 2) - 1)]!;
	const testStart =
		dates[Math.min(dates.length - 1, Math.floor(dates.length / 2))]!;
	const trainStart = dates[0]!;
	const result = runBacktest(
		events.filter((event) => event.occurredAt >= testStart),
		prices,
		{ ...config, start: testStart },
	);
	const fold: WalkForwardFold = {
		trainStart,
		trainEnd: split,
		testStart,
		testEnd: config.end,
		result,
		benchmarkReturn: benchmarkReturn(prices, testStart, config.end),
	};
	return {
		status: result.trades.length ? "ok" : "insufficient_data",
		mode,
		folds: [fold],
		combinedReturn: result.trades.length ? result.totalReturn : null,
		benchmarkReturn: fold.benchmarkReturn,
		message: result.trades.length
			? undefined
			: "样本外窗口没有符合阈值的可执行信号。",
	};
}
