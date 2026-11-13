import {
	type CuratedJobBoard,
	deduplicateNormalizedJobs,
	parseAshbyJob,
	parseGreenhouseJob,
	parseLeverJob,
} from "./phase2";
import type {
	CampusOpportunity,
	JobPosting,
	JobProvider,
	SourceEvidence,
} from "./types";
import { validateJobPosting } from "./validation";

export type JobBoardProvider = Exclude<JobProvider, "user-provided" | "sample">;

export interface AllowedJobBoard extends CuratedJobBoard {}

export interface AdapterOptions {
	timeoutMs?: number;
	retries?: number;
	backoffMs?: number;
	now?: Date;
}

export interface JobBoardFetchResult {
	postings: JobPosting[];
	source: SourceEvidence;
	status: "live" | "empty" | "unavailable" | "stale";
	errors: string[];
	observedAt: string;
}

export interface JobBoardAdapter {
	provider: JobBoardProvider;
	fetchPublicPostings(
		board: AllowedJobBoard,
		options?: AdapterOptions,
	): Promise<JobBoardFetchResult>;
}

export interface CampusSourceAdapter {
	id: string;
	fetchOpportunities(): Promise<{
		opportunities: CampusOpportunity[];
		source: SourceEvidence;
		status: "live" | "empty" | "unavailable" | "stale";
	}>;
}

/** Explicit allowlist: an empty list means no live external fetch occurs until verified boards are configured. */
export const allowedJobBoards: AllowedJobBoard[] = [
	{
		provider: "lever",
		company: "Simbe Robotics",
		boardId: "SimbeRobotics",
		publicUrl: "https://jobs.lever.co/SimbeRobotics",
		enabled: true,
	},
];
export const campusSourceAdapters: CampusSourceAdapter[] = [];

function sourceFor(board: AllowedJobBoard, observedAt: string): SourceEvidence {
	return {
		id: `${board.provider}-${board.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${board.boardId}`,
		label: `${board.company} public ${board.provider} board`,
		kind: "official",
		url: board.publicUrl,
		retrievedAt: observedAt,
		note: "Public provider endpoint. Publication and update dates are only retained when the provider supplies them.",
	};
}

async function requestJson(
	url: string,
	options: AdapterOptions = {},
): Promise<unknown> {
	const timeoutMs = options.timeoutMs ?? 10_000;
	const retries = options.retries ?? 2;
	const backoffMs = options.backoffMs ?? 300;
	let lastError: unknown;
	for (let attempt = 0; attempt <= retries; attempt += 1) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetch(url, {
				headers: { Accept: "application/json" },
				signal: controller.signal,
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return await response.json();
		} catch (error) {
			lastError = error;
			if (attempt < retries)
				await new Promise((resolve) =>
					setTimeout(resolve, backoffMs * 2 ** attempt),
				);
		} finally {
			clearTimeout(timer);
		}
	}
	throw lastError instanceof Error
		? lastError
		: new Error("Unknown provider request failure");
}

function result(
	board: AllowedJobBoard,
	observedAt: string,
	postings: JobPosting[],
	errors: string[],
): JobBoardFetchResult {
	const validated = postings.filter(
		(posting) => validateJobPosting(posting).ok,
	);
	return {
		postings: deduplicateNormalizedJobs(validated),
		source: sourceFor(board, observedAt),
		status:
			errors.length > 0
				? validated.length > 0
					? "live"
					: "unavailable"
				: validated.length > 0
					? "live"
					: "empty",
		errors,
		observedAt,
	};
}

export class GreenhouseJobBoardAdapter implements JobBoardAdapter {
	provider: JobBoardProvider = "greenhouse";

	async fetchPublicPostings(
		board: AllowedJobBoard,
		options: AdapterOptions = {},
	): Promise<JobBoardFetchResult> {
		const observedAt = (options.now ?? new Date()).toISOString();
		try {
			const payload = await requestJson(
				`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.boardId)}/jobs?content=true`,
				options,
			);
			const jobs =
				payload &&
				typeof payload === "object" &&
				!Array.isArray(payload) &&
				Array.isArray((payload as { jobs?: unknown[] }).jobs)
					? (payload as { jobs: unknown[] }).jobs
					: [];
			return result(
				board,
				observedAt,
				jobs
					.map((job) => parseGreenhouseJob(job, board, observedAt))
					.filter((job): job is JobPosting => job !== null),
				[],
			);
		} catch (error) {
			return result(
				board,
				observedAt,
				[],
				[error instanceof Error ? error.message : "Greenhouse request failed"],
			);
		}
	}
}

export class LeverJobBoardAdapter implements JobBoardAdapter {
	provider: JobBoardProvider = "lever";

	async fetchPublicPostings(
		board: AllowedJobBoard,
		options: AdapterOptions = {},
	): Promise<JobBoardFetchResult> {
		const observedAt = (options.now ?? new Date()).toISOString();
		try {
			const payload = await requestJson(
				`https://api.lever.co/v0/postings/${encodeURIComponent(board.boardId)}?mode=json`,
				options,
			);
			const jobs = Array.isArray(payload) ? payload : [];
			return result(
				board,
				observedAt,
				jobs
					.map((job) => parseLeverJob(job, board, observedAt))
					.filter((job): job is JobPosting => job !== null),
				[],
			);
		} catch (error) {
			return result(
				board,
				observedAt,
				[],
				[error instanceof Error ? error.message : "Lever request failed"],
			);
		}
	}
}

export class AshbyJobBoardAdapter implements JobBoardAdapter {
	provider: JobBoardProvider = "ashby";

	async fetchPublicPostings(
		board: AllowedJobBoard,
		options: AdapterOptions = {},
	): Promise<JobBoardFetchResult> {
		const observedAt = (options.now ?? new Date()).toISOString();
		try {
			const payload = await requestJson(
				`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.boardId)}`,
				options,
			);
			const jobs =
				payload &&
				typeof payload === "object" &&
				!Array.isArray(payload) &&
				Array.isArray((payload as { jobs?: unknown[] }).jobs)
					? (payload as { jobs: unknown[] }).jobs
					: [];
			return result(
				board,
				observedAt,
				jobs
					.map((job) => parseAshbyJob(job, board, observedAt))
					.filter((job): job is JobPosting => job !== null),
				[],
			);
		} catch (error) {
			return result(
				board,
				observedAt,
				[],
				[error instanceof Error ? error.message : "Ashby request failed"],
			);
		}
	}
}

export function adapterFor(provider: JobBoardProvider): JobBoardAdapter {
	switch (provider) {
		case "greenhouse":
			return new GreenhouseJobBoardAdapter();
		case "lever":
			return new LeverJobBoardAdapter();
		case "ashby":
			return new AshbyJobBoardAdapter();
	}
}

/** Safe placeholder for unconfigured boards; it never pretends an empty result is live. */
export class UnconfiguredJobBoardAdapter implements JobBoardAdapter {
	constructor(public provider: JobBoardProvider) {}

	async fetchPublicPostings(
		board: AllowedJobBoard,
		options: AdapterOptions = {},
	): Promise<JobBoardFetchResult> {
		const observedAt = (options.now ?? new Date()).toISOString();
		const source = sourceFor(board, observedAt);
		return {
			postings: [],
			source: {
				...source,
				kind: "unknown",
				note: "No live data is shown until the board is explicitly allowlisted and a sync is run.",
			},
			status: "unavailable",
			errors: [`${this.provider} board adapter is not configured`],
			observedAt,
		};
	}
}
