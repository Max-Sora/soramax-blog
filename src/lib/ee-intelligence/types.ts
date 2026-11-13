export type EvidencePolarity = "supports" | "contradicts" | "mixed" | "unknown";
export type UncertaintyLevel = "low" | "medium" | "high";
export type ImportanceLabel = "critical" | "high" | "watch";

export interface NewsSource {
	id: string;
	name: string;
	url: string;
	tier: "primary" | "specialist" | "secondary" | "simulated";
	publishedAt: string;
	observedAt: string;
	excerpt: string;
	isSimulated: boolean;
}

export interface NewsItem {
	id: string;
	sourceId: string;
	title: string;
	summary: string;
	body: string;
	url: string;
	publishedAt: string;
	category: "policy" | "supply" | "research" | "company" | "market";
	entities: string[];
	impact: number;
	polarity: EvidencePolarity;
	confidence: number;
}

export interface EvidenceItem {
	polarity: EvidencePolarity;
	statement: string;
	sourceIds: string[];
}

export interface EventCluster {
	id: string;
	title: string;
	category: NewsItem["category"];
	occurredAt: string;
	summary: string;
	importanceScore: number;
	importanceLabel: ImportanceLabel;
	articleIds: string[];
	sources: NewsSource[];
	evidence: EvidenceItem[];
	uncertainty: UncertaintyLevel;
	uncertaintyReasons: string[];
}

export interface PriceBar {
	date: string;
	symbol: string;
	open: number;
	close: number;
}

export interface BacktestConfig {
	symbol: string;
	start: string;
	end: string;
	importanceThreshold: number;
	costBps: number;
	holdingDays: number;
}

export interface BacktestTrade {
	eventId: string;
	eventTitle: string;
	direction: 1 | -1;
	signalDate: string;
	entryDate: string;
	exitDate: string;
	entryPrice: number;
	exitPrice: number;
	grossReturn: number;
	transactionCost: number;
	netReturn: number;
}

export interface BacktestResult {
	config: BacktestConfig;
	trades: BacktestTrade[];
	totalReturn: number;
	totalCosts: number;
	winRate: number;
	maxDrawdown: number;
	noLookahead: boolean;
	lookaheadViolations: string[];
	equityCurve: Array<{ date: string; value: number }>;
	status: "simulated";
}
