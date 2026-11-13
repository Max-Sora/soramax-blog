import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { adapterFor, type AllowedJobBoard } from "../src/lib/career-navigator/adapters";
import { deduplicateNormalizedJobs, DEFAULT_CURATED_BOARDS, isJobSnapshot, type JobSnapshot } from "../src/lib/career-navigator/phase2";
import type { JobPosting } from "../src/lib/career-navigator/types";

function loadBoards(): AllowedJobBoard[] {
	const raw = process.env.CAREER_NAVIGATOR_BOARDS_JSON;
	if (!raw) return DEFAULT_CURATED_BOARDS.filter((board) => board.enabled !== false);
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item): item is AllowedJobBoard => {
			if (!item || typeof item !== "object") return false;
			const board = item as Record<string, unknown>;
			return ["greenhouse", "lever", "ashby"].includes(String(board.provider)) && typeof board.company === "string" && typeof board.boardId === "string" && typeof board.publicUrl === "string" && board.enabled !== false;
		});
	} catch {
		return [];
	}
}

async function loadPreviousSnapshot(outputPath: string): Promise<JobSnapshot | undefined> {
	try {
		const parsed: unknown = JSON.parse(await readFile(outputPath, "utf8"));
		return isJobSnapshot(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

const outputPath = path.resolve("src/data/career-navigator/jobs.json");
const previous = await loadPreviousSnapshot(outputPath);
const boards = loadBoards();
const observedAt = new Date().toISOString();
const errors: JobSnapshot["errors"] = [];
const allJobs: JobPosting[] = [];

for (const board of boards) {
	const response = await adapterFor(board.provider).fetchPublicPostings(board, { now: new Date(observedAt) });
	allJobs.push(...response.postings);
	for (const message of response.errors) errors.push({ provider: board.provider, boardId: board.boardId, message, at: observedAt });
}

const fetchedJobs = deduplicateNormalizedJobs(allJobs);
const jobs = errors.length > 0 && previous && fetchedJobs.length === 0 ? previous.jobs : fetchedJobs;
const lastSuccessfulSync = errors.length === 0 && boards.length > 0 ? observedAt : previous?.lastSuccessfulSync;
const snapshot: JobSnapshot = {
	generatedAt: observedAt,
	lastSuccessfulSync,
	jobs,
	validatedJobs: jobs.length,
	staleJobs: jobs.filter((job) => job.freshnessStatus === "stale").length,
	expiredJobs: 0,
	errors,
	status: boards.length === 0 ? "unavailable" : errors.length > 0 ? (jobs.length > 0 ? "partial" : "unavailable") : jobs.length > 0 ? "live" : "empty",
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, status: snapshot.status, validatedJobs: snapshot.validatedJobs, errors: snapshot.errors.length, preservedPrevious: errors.length > 0 && fetchedJobs.length === 0 && Boolean(previous) }, null, 2));
