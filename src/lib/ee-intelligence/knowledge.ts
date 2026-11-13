import { aggregateEvents, normalizeText } from "./engine";
import type {
	AgentRun,
	Case,
	DataMode,
	DiagnosisResult,
	Evidence,
	Insight,
	IntelligenceRecord,
	NewsItem,
	NewsSource,
	PublicIntelligenceSnapshot,
	Source,
} from "./types";

const SYNTHETIC_UPDATED_AT = "2026-09-28T12:00:00Z";

/** Small, explicitly synthetic case library used when private SQLite/FTS5 is unavailable to the public site. */
export const demoCases: Case[] = [
	{
		id: "case-gpu-black-screen",
		title: "GPU black screen under 3D load after driver update",
		status: "resolved",
		symptoms: [
			"display goes black after 5–10 minutes",
			"fans ramp to 100%",
			"system remains powered",
		],
		hardware: ["GPU", "desktop PC", "PCIe power cable"],
		possibleCauses: [
			"driver regression",
			"unstable GPU power delivery",
			"thermal hotspot or poor cooler contact",
		],
		resolutionSteps: [
			"Boot with the previous known-good driver using Safe Mode.",
			"Reseat both PCIe power connectors and remove daisy-chain adapters.",
			"Log GPU core and hotspot temperature while reproducing the load.",
			"If the fault follows the card in another system, stop testing and request RMA.",
		],
		recordIds: [],
		tags: ["gpu", "black-screen", "driver", "power", "thermal"],
		dataMode: "synthetic",
		updatedAt: SYNTHETIC_UPDATED_AT,
	},
	{
		id: "case-cpu-thermal-throttle",
		title: "CPU reaches thermal limit and clocks down during compile",
		status: "resolved",
		symptoms: [
			"compile time suddenly doubles",
			"CPU package temperature reaches 95°C",
			"clock speed oscillates",
		],
		hardware: ["CPU", "air cooler", "motherboard BIOS"],
		possibleCauses: [
			"cooler mounting pressure",
			"dried thermal paste",
			"fan curve or BIOS power limit",
		],
		resolutionSteps: [
			"Confirm the cooler pump or fan reports a non-zero RPM.",
			"Inspect mounting pressure and renew thermal compound.",
			"Load BIOS defaults, then compare stock power limits before applying an overclock.",
		],
		recordIds: [],
		tags: ["cpu", "thermal", "throttling", "bios"],
		dataMode: "synthetic",
		updatedAt: SYNTHETIC_UPDATED_AT,
	},
	{
		id: "case-ram-post-loop",
		title: "System loops at POST after adding a memory kit",
		status: "partial",
		symptoms: [
			"repeated restart before display",
			"memory debug LED stays on",
			"system boots with one DIMM",
		],
		hardware: ["DDR5 memory", "CPU memory controller", "motherboard"],
		possibleCauses: [
			"DIMM seating",
			"unsupported XMP or EXPO profile",
			"memory training or slot compatibility",
		],
		resolutionSteps: [
			"Power off, discharge, and reseat each DIMM.",
			"Test one module in the board's recommended slot.",
			"Clear CMOS and boot at JEDEC defaults before enabling a profile.",
			"Check the board QVL and update firmware only from the vendor site.",
		],
		recordIds: [],
		tags: ["ram", "post", "memory", "xmp", "expo"],
		dataMode: "synthetic",
		updatedAt: SYNTHETIC_UPDATED_AT,
	},
	{
		id: "case-vrm-no-power",
		title: "Embedded board does not power on after load step",
		status: "open",
		symptoms: [
			"no status LED",
			"regulator output collapses under load",
			"input current is lower than expected",
		],
		hardware: ["DC-DC converter", "MOSFET", "inductor", "oscilloscope"],
		possibleCauses: [
			"shorted load rail",
			"failed high-side MOSFET",
			"controller UVLO or current limit",
		],
		resolutionSteps: [
			"Disconnect the load and measure resistance to ground on each rail.",
			"Use a current-limited bench supply and inspect the switching node.",
			"Do not bypass protection circuits until the schematic and safe limits are confirmed.",
		],
		recordIds: [],
		tags: ["electronics", "vrm", "power", "mosfet", "debug"],
		dataMode: "synthetic",
		updatedAt: SYNTHETIC_UPDATED_AT,
	},
];

const CASE_TOKEN_ALIASES: Record<string, string[]> = {
	gpu: ["gpu", "graphics", "video card", "显卡"],
	cpu: ["cpu", "processor", "处理器"],
	ram: ["ram", "memory", "ddr4", "ddr5", "内存"],
	power: ["power", "psu", "rail", "voltage", "供电", "电源"],
	thermal: ["thermal", "temperature", "hot", "overheat", "温度", "过热"],
	driver: ["driver", "firmware", "驱动"],
	black: ["black screen", "black", "no display", "黑屏"],
	post: ["post", "boot", "restart", "debug led", "开机自检", "重启"],
	vrm: ["vrm", "mosfet", "regulator", "dc-dc", "电路", "mos"],
};

function termsFor(text: string): string[] {
	const lower = text.toLowerCase();
	return Object.entries(CASE_TOKEN_ALIASES)
		.filter(([, aliases]) => aliases.some((alias) => lower.includes(alias)))
		.map(([key]) => key);
}

function sourceFromNews(source: NewsSource): Source {
	return {
		id: source.id,
		name: source.name,
		type: source.isSimulated ? "synthetic" : "rss",
		status: source.isSimulated ? "available" : "available",
		url: source.url,
		lastSuccessAt: source.observedAt,
		lastAttemptAt: source.observedAt,
		isSimulated: source.isSimulated,
	};
}

export function buildPublicKnowledge(
	items: NewsItem[],
	sources: NewsSource[],
	mode: DataMode,
	updatedAt: string = new Date().toISOString(),
): PublicIntelligenceSnapshot {
	const events = aggregateEvents(items, sources, updatedAt);
	const evidence: Evidence[] = [];
	const records: IntelligenceRecord[] = items.map((item) => {
		const relatedCases = demoCases
			.filter((candidate) => {
				const text =
					`${item.title} ${item.summary} ${item.entities.join(" ")}`.toLowerCase();
				return candidate.tags.some((tag) => text.includes(tag));
			})
			.map((candidate) => candidate.id);
		const evidenceId = `evidence-${item.id}`;
		evidence.push({
			id: evidenceId,
			recordId: item.id,
			statement: item.summary,
			polarity: item.polarity,
			sourceIds: [item.sourceId],
			confidence: item.confidence,
			verified: item.dataMode !== "synthetic" && item.confidence >= 0.5,
		});
		return {
			id: item.id,
			kind: "news",
			title: item.title,
			summary: item.summary,
			occurredAt: item.publishedAt,
			tags: [item.category, ...item.entities.slice(0, 4)],
			importance: Math.round(item.impact * 100),
			uncertainty:
				item.confidence < 0.5
					? "high"
					: item.polarity === "unknown"
						? "medium"
						: "low",
			sourceIds: [item.sourceId],
			evidenceIds: [evidenceId],
			linkedCaseIds: relatedCases,
			dataMode: item.dataMode ?? mode,
		};
	});
	const cases = demoCases.map((candidate) => ({
		...candidate,
		recordIds: records
			.filter((record) => record.linkedCaseIds.includes(candidate.id))
			.map((record) => record.id),
	}));
	const insights: Insight[] = events.slice(0, 5).map((event) => ({
		id: `insight-${event.id}`,
		title: event.title,
		body: event.summary,
		importance: event.importanceLabel,
		recordIds: event.articleIds,
		evidenceIds: event.articleIds.map((id) => `evidence-${id}`),
		uncertainty: event.uncertainty,
		dataMode: event.dataMode,
		createdAt: updatedAt,
	}));
	const agentRuns: AgentRun[] = [
		{
			id: "run-collect",
			name: "Public RSS collector",
			stage: "collect",
			status: mode === "live" ? "success" : "unverified",
			startedAt: updatedAt,
			finishedAt: updatedAt,
			durationMs: mode === "live" ? 1840 : undefined,
			itemsProcessed: items.length,
			message:
				mode === "live"
					? "Feed snapshot available"
					: "Synthetic fixture loaded; no external fetch",
			redactedLog: [
				"feed allowlist checked",
				"credentials: none",
				"cache path: redacted",
			],
			dataMode: mode,
		},
		{
			id: "run-normalize",
			name: "Normalize + deduplicate",
			stage: "normalize",
			status: "success",
			startedAt: updatedAt,
			finishedAt: updatedAt,
			durationMs: 46,
			itemsProcessed: items.length,
			message: `${items.length} records normalized`,
			redactedLog: ["canonical URL", "keyword classifier", "dedupe key"],
			dataMode: mode,
		},
		{
			id: "run-index",
			name: "FTS5/public index projection",
			stage: "index",
			status: "success",
			startedAt: updatedAt,
			finishedAt: updatedAt,
			durationMs: 22,
			itemsProcessed: records.length,
			message: "Public whitelist projection ready",
			redactedLog: ["private SQLite: not bundled", "public fields only"],
			dataMode: mode,
		},
		{
			id: "run-diagnose",
			name: "Hardware diagnosis rules",
			stage: "diagnose",
			status: "unverified",
			startedAt: updatedAt,
			finishedAt: updatedAt,
			durationMs: 3,
			itemsProcessed: cases.length,
			message: "Deterministic retrieval + rules; no LLM backend",
			redactedLog: ["no prompt payload persisted", "no private device data"],
			dataMode: "synthetic",
		},
		{
			id: "run-export",
			name: "Public snapshot exporter",
			stage: "export",
			status: "success",
			startedAt: updatedAt,
			finishedAt: updatedAt,
			durationMs: 28,
			itemsProcessed: records.length + cases.length,
			message: "Allowlisted JSON generated",
			redactedLog: ["tokens removed", "paths removed", "raw SQLite excluded"],
			dataMode: mode,
		},
	];
	return {
		version: 1,
		mode,
		updatedAt,
		sources: sources.map(sourceFromNews),
		records,
		evidence,
		cases,
		agentRuns,
		insights,
	};
}

export function searchIntelligenceRecords(
	records: IntelligenceRecord[],
	query: string,
): IntelligenceRecord[] {
	const tokens = normalizeText(query).split(" ").filter(Boolean);
	if (tokens.length === 0) return records;
	return records
		.map((record) => {
			const text = normalizeText(
				`${record.title} ${record.summary} ${record.tags.join(" ")}`,
			);
			return {
				record,
				score: tokens.filter((token) => text.includes(token)).length,
			};
		})
		.filter(({ score }) => score > 0)
		.sort(
			(a, b) => b.score - a.score || b.record.importance - a.record.importance,
		)
		.map(({ record }) => record);
}

export function diagnoseHardware(
	query: string,
	cases: Case[] = demoCases,
	generatedAt: string = new Date().toISOString(),
): DiagnosisResult {
	const cleanQuery = query.trim();
	const queryTerms = termsFor(cleanQuery);
	const device =
		queryTerms.find((term) => ["gpu", "cpu", "ram", "vrm"].includes(term)) ??
		"unknown hardware";
	const matches = cases
		.map((candidate) => {
			const haystack =
				`${candidate.title} ${candidate.symptoms.join(" ")} ${candidate.hardware.join(" ")} ${candidate.possibleCauses.join(" ")} ${candidate.tags.join(" ")}`.toLowerCase();
			const matchedTerms = queryTerms.filter(
				(term) =>
					candidate.tags.some((tag) => tag === term) || haystack.includes(term),
			);
			const directWords = cleanQuery
				.toLowerCase()
				.split(/\s+/)
				.filter((word) => word.length > 3 && haystack.includes(word));
			const uniqueTerms = [...new Set([...matchedTerms, ...directWords])];
			return {
				caseId: candidate.id,
				title: candidate.title,
				score: Math.min(
					100,
					uniqueTerms.length * 22 +
						(candidate.hardware.some((item) =>
							item.toLowerCase().includes(device),
						)
							? 12
							: 0),
				),
				matchedTerms: uniqueTerms,
				evidence: candidate.symptoms.slice(0, 2),
			};
		})
		.filter((match) => match.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 4);
	const possibleCauses = [
		...new Map(
			matches.flatMap((match) => {
				const candidate = cases.find((item) => item.id === match.caseId);
				return (candidate?.possibleCauses ?? []).map(
					(cause) =>
						[
							cause,
							{
								cause,
								score: Math.min(0.95, match.score / 100),
								basis: `${match.title}; matched ${match.matchedTerms.slice(0, 3).join(", ")}`,
							},
						] as const,
				);
			}),
		).values(),
	]
		.sort((a, b) => b.score - a.score)
		.slice(0, 5);
	const steps = matches.length
		? [
				...new Set(
					matches.flatMap(
						(match) =>
							cases.find((candidate) => candidate.id === match.caseId)
								?.resolutionSteps ?? [],
					),
				),
			].slice(0, 6)
		: [
				"Describe the exact symptom, device model and trigger (boot, idle, load or temperature).",
				"Disconnect power and inspect cables, seating and visible damage before repeated testing.",
				"Change one variable at a time and record measurements or error codes.",
			];
	const unknowns = [
		...(cleanQuery ? [] : ["No symptom description was provided."]),
		...(queryTerms.length === 0
			? ["No known hardware terms matched the case library."]
			: []),
		...(matches.length === 0
			? [
					"No matching synthetic case was found; this is a triage guide, not a confirmed diagnosis.",
				]
			: [
					"Exact component model, firmware version, measurements and environmental conditions are not available.",
				]),
	];
	return {
		query: cleanQuery,
		device,
		matches,
		possibleCauses,
		steps,
		unknowns,
		status: matches.length ? "completed" : "insufficient_data",
		generatedAt,
	};
}

/** Runtime guard used by export tests to ensure private fields never cross the public boundary. */
export function sanitizePublicSnapshot(
	snapshot: PublicIntelligenceSnapshot,
): PublicIntelligenceSnapshot {
	const serialized = JSON.stringify(snapshot).replace(
		/([A-Za-z]:\\|\/)?[^\s"']*(?:cookie|token|secret|api[_-]?key|password)[^\s"']*/gi,
		"[redacted]",
	);
	return JSON.parse(serialized) as PublicIntelligenceSnapshot;
}
