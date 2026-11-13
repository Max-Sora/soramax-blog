import type {
	CompanyRef,
	EventCluster,
	ResearchSignal,
	SignalDirection,
} from "./types";

function eventPolarity(event: EventCluster): number {
	let score = 0;
	for (const evidence of event.evidence) {
		if (evidence.polarity === "supports") score += 1;
		if (evidence.polarity === "contradicts") score -= 1;
	}
	return score;
}

function directionFor(
	strength: number,
	eventCount: number,
	hasUnknown: boolean,
): SignalDirection {
	if (eventCount === 0 || (hasUnknown && Math.abs(strength) < 0.4))
		return "insufficient_data";
	if (strength >= 0.45) return "bullish";
	if (strength <= -0.45) return "bearish";
	return "neutral";
}

function confidenceFor(events: EventCluster[], strength: number): number {
	if (events.length === 0) return 0;
	const sourceCount = new Set(
		events.flatMap((event) => event.sources.map((source) => source.id)),
	).size;
	const uncertaintyPenalty =
		events.reduce(
			(sum, event) =>
				sum +
				(event.uncertainty === "high"
					? 0.2
					: event.uncertainty === "medium"
						? 0.1
						: 0),
			0,
		) / events.length;
	return Math.max(
		0,
		Math.min(
			0.95,
			0.3 +
				Math.min(0.3, sourceCount * 0.08) +
				Math.min(0.2, events.length * 0.06) +
				Math.min(0.15, Math.abs(strength) * 0.15) -
				uncertaintyPenalty,
		),
	);
}

export function deriveResearchSignals(
	events: EventCluster[],
): ResearchSignal[] {
	const companies = [
		...new Map(
			events
				.flatMap((event) => event.companies)
				.map((company) => [company.ticker ?? company.name, company] as const),
		).values(),
	];
	return companies.map((company) => {
		const related = events.filter((event) =>
			event.companies.some(
				(candidate) =>
					(candidate.ticker ?? candidate.name) ===
					(company.ticker ?? company.name),
			),
		);
		const usable = related.filter((event) =>
			event.evidence.some(
				(evidence) =>
					evidence.polarity === "supports" ||
					evidence.polarity === "contradicts",
			),
		);
		const rawStrength = usable.reduce(
			(sum, event) =>
				sum + eventPolarity(event) * (event.importanceScore / 100),
			0,
		);
		const strength = usable.length ? rawStrength / usable.length : 0;
		const unknowns = related
			.flatMap((event) => event.uncertaintyReasons)
			.filter((reason, index, all) => all.indexOf(reason) === index);
		const direction = directionFor(
			strength,
			usable.length,
			unknowns.length > 0,
		);
		const facts = related
			.flatMap((event) =>
				event.evidence
					.filter((evidence) => evidence.polarity !== "unknown")
					.map((evidence) => evidence.statement),
			)
			.filter((value, index, all) => all.indexOf(value) === index)
			.slice(0, 4);
		const inferences =
			direction === "insufficient_data"
				? ["当前事件证据不足，系统不生成方向性判断。"]
				: direction === "neutral"
					? ["正反证据接近，方向性优势不足。"]
					: [
							`事件影响加权后偏向 ${direction === "bullish" ? "正向" : "负向"}，仅作为研究线索。`,
						];
		if (!company.ticker) unknowns.push("没有可验证的上市股票代码");
		return {
			company,
			direction,
			confidence: confidenceFor(usable, strength),
			strength,
			eventIds: related.map((event) => event.id),
			facts,
			inferences,
			unknowns: [...new Set(unknowns)],
			dataMode: related.some((event) => event.dataMode === "live")
				? "live"
				: "synthetic",
		};
	});
}

export function signalForCompany(
	signals: ResearchSignal[],
	ticker: string,
): ResearchSignal | undefined {
	return signals.find(
		(signal) => signal.company.ticker?.toUpperCase() === ticker.toUpperCase(),
	);
}

export function companyLabel(company: CompanyRef): string {
	return company.ticker ? `${company.name} (${company.ticker})` : company.name;
}
