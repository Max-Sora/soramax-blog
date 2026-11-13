import { isStaleJob, normalizeSkillIds } from "./engine";
import { careers, skills } from "./fixtures";
import type {
	CampusOpportunity,
	CompensationRange,
	JobPosting,
	JobProvider,
	JobRequirement,
	SourceEvidence,
	StudentProfile,
} from "./types";
import { validateJobPosting } from "./validation";

export interface CuratedJobBoard {
	provider: Exclude<JobProvider, "user-provided" | "sample">;
	company: string;
	boardId: string;
	publicUrl: string;
	enabled?: boolean;
}

export interface SyncError {
	provider: JobProvider;
	boardId?: string;
	message: string;
	at: string;
}

export interface JobSnapshot {
	generatedAt: string;
	lastSuccessfulSync?: string;
	jobs: JobPosting[];
	validatedJobs: number;
	staleJobs: number;
	expiredJobs: number;
	errors: SyncError[];
	status: "live" | "empty" | "partial" | "unavailable";
}

export interface CampusSnapshot {
	lastCheckedAt: string;
	opportunities: CampusOpportunity[];
	errors: SyncError[];
	status: "live" | "empty" | "partial" | "unavailable";
}

export const EMPTY_JOB_SNAPSHOT: JobSnapshot = {
	generatedAt: "",
	jobs: [],
	validatedJobs: 0,
	staleJobs: 0,
	expiredJobs: 0,
	errors: [],
	status: "unavailable",
};

export const DEFAULT_CURATED_BOARDS: CuratedJobBoard[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function sanitizeText(value: unknown, maxLength = 60_000): string {
	if (typeof value !== "string") return "";
	return value
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, maxLength);
}

function stableId(value: string): string {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return Math.abs(hash >>> 0).toString(36);
}

function dateFromMilliseconds(value: unknown): string | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function dateFromString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function inferWorkMode(value: unknown, text: string): JobPosting["remoteMode"] {
	const normalized =
		typeof value === "string" ? value.toLowerCase() : text.toLowerCase();
	if (normalized.includes("remote")) return "remote";
	if (normalized.includes("hybrid")) return "hybrid";
	if (normalized.includes("onsite") || normalized.includes("on-site"))
		return "onsite";
	return "unknown";
}

function inferInternshipEligibility(
	title: string,
	description: string,
): JobPosting["internshipEligibility"] {
	const text = `${title} ${description}`.toLowerCase();
	if (/\bintern(ship)?\b|co[- ]?op|student worker|undergraduate/.test(text))
		return "explicit-yes";
	if (
		/senior|principal|director|manager/.test(title.toLowerCase()) &&
		!/intern/.test(text)
	)
		return "explicit-no";
	return "unknown";
}

function parseCompensation(
	value: unknown,
	text?: string,
): CompensationRange | undefined {
	if (!isRecord(value))
		return text ? { text: sanitizeText(text, 500) } : undefined;
	const min = typeof value.min === "number" ? value.min : undefined;
	const max = typeof value.max === "number" ? value.max : undefined;
	const currency =
		typeof value.currency === "string" ? value.currency : undefined;
	const interval =
		typeof value.interval === "string" ? value.interval : undefined;
	if (min === undefined && max === undefined && !currency && !interval && !text)
		return undefined;
	return {
		min,
		max,
		currency,
		interval,
		text: text ? sanitizeText(text, 500) : undefined,
	};
}

function requirementCategory(skillId: string): JobRequirement["category"] {
	if (
		[
			"technical",
			"digital-logic",
			"verilog",
			"microcontrollers",
			"embedded-debugging",
			"simulation-verification",
		].includes(skillId)
	)
		return "technical";
	if (["team-communication", "technical-writing"].includes(skillId))
		return "communication";
	return "other";
}

export function extractRequirements(
	description: string,
	sourceEvidenceId: string,
): JobRequirement[] {
	const lines = description
		.split(/\r?\n|(?<=[.!?])\s+/)
		.map((line) => sanitizeText(line, 500))
		.filter((line) => line.length > 3);

	const requirements: JobRequirement[] = [];
	const seen = new Set<string>();
	for (const line of lines) {
		const skillIds = normalizeSkillIds(line, skills);
		if (skillIds.length === 0) continue;
		const importance: JobRequirement["importance"] =
			/required|must|required qualifications|what you.ll bring|need to/i.test(
				line,
			)
				? "mandatory"
				: /preferred|bonus|nice to have|plus/i.test(line)
					? "preferred"
					: "unknown";
		for (const skillId of skillIds) {
			const id = `req-${stableId(`${skillId}:${line}`)}`;
			if (seen.has(id)) continue;
			seen.add(id);
			requirements.push({
				id,
				label: line,
				skillId,
				category: requirementCategory(skillId),
				importance,
				evidenceId: sourceEvidenceId,
				evidenceText: line,
				extractionMethod: "explicit",
			});
		}
	}
	return requirements;
}

export function freshnessStatus(
	posting: JobPosting,
	observedAt: Date,
	maxAgeDays = 45,
): JobPosting["freshnessStatus"] {
	if (!posting.postedAt && !posting.publishedAt && !posting.lastUpdatedAt)
		return "unknown";
	return isStaleJob(posting, observedAt, maxAgeDays) ? "stale" : "fresh";
}

export function normalizeJobPosting(input: {
	provider: Exclude<JobProvider, "user-provided" | "sample">;
	company: string;
	boardId: string;
	id: string;
	title: string;
	location?: string;
	remoteMode?: string;
	description?: string;
	applicationUrl?: string;
	originalSourceUrl?: string;
	postedAt?: string;
	publishedAt?: string;
	lastUpdatedAt?: string;
	employmentType?: string;
	compensation?: CompensationRange;
	observedAt: string;
	source: SourceEvidence;
}): JobPosting {
	const description = sanitizeText(input.description);
	const posting: JobPosting = {
		id: `${input.provider}:${input.company}:${input.id}`,
		title: sanitizeText(input.title, 240),
		company: sanitizeText(input.company, 160),
		location: sanitizeText(input.location ?? "UNKNOWN", 240) || "UNKNOWN",
		url: input.originalSourceUrl,
		applicationUrl: input.applicationUrl,
		postedAt: input.postedAt,
		publishedAt: input.publishedAt,
		retrievedAt: input.observedAt,
		observedAt: input.observedAt,
		lastUpdatedAt: input.lastUpdatedAt,
		provider: input.provider,
		originalSourceUrl: input.originalSourceUrl,
		remoteMode: inferWorkMode(input.remoteMode, input.location ?? ""),
		employmentType: input.employmentType,
		internshipEligibility: inferInternshipEligibility(input.title, description),
		description,
		compensation: input.compensation,
		requirements: extractRequirements(description, input.source.id),
		sourceEvidenceId: input.source.id,
		freshnessStatus: "unknown",
	};
	posting.freshnessStatus = freshnessStatus(
		posting,
		new Date(input.observedAt),
	);
	return posting;
}

export function deduplicateNormalizedJobs(jobs: JobPosting[]): JobPosting[] {
	const seen = new Set<string>();
	return jobs.filter((job) => {
		const key = `${job.company.toLowerCase()}|${job.title.toLowerCase()}|${job.applicationUrl ?? job.url ?? job.id}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function filterRelevantJobs(
	jobs: JobPosting[],
	careerId?: string,
): JobPosting[] {
	if (!careerId) return jobs;
	const career = careers.find((item) => item.id === careerId);
	if (!career) return jobs;
	return jobs.filter((job) => {
		const ids = new Set(
			job.requirements.flatMap((requirement) =>
				requirement.skillId ? [requirement.skillId] : [],
			),
		);
		return (
			career.skillIds.some((skillId) => ids.has(skillId)) ||
			career.title
				.toLowerCase()
				.split(/\s+/)
				.some((term) => job.title.toLowerCase().includes(term))
		);
	});
}

export function createEmptyCampusSnapshot(lastCheckedAt: string): {
	lastCheckedAt: string;
	opportunities: CampusOpportunity[];
	errors: SyncError[];
	status: "empty";
} {
	return { lastCheckedAt, opportunities: [], errors: [], status: "empty" };
}

export function buildSourceEvidence(
	provider: JobProvider,
	label: string,
	url: string,
	observedAt: string,
): SourceEvidence {
	return {
		id: `${provider}-${stableId(url)}`,
		label,
		kind: provider === "sample" ? "sample" : "official",
		url,
		retrievedAt: observedAt,
		note: "Observed from a public provider endpoint. Publication and update dates are only populated when the provider supplies them.",
	};
}

export function isJobSnapshot(value: unknown): value is JobSnapshot {
	if (!isRecord(value)) return false;
	return (
		typeof value.generatedAt === "string" &&
		Array.isArray(value.jobs) &&
		typeof value.validatedJobs === "number" &&
		Array.isArray(value.errors)
	);
}

export function parseGreenhouseJob(
	raw: unknown,
	board: CuratedJobBoard,
	observedAt: string,
): JobPosting | null {
	if (
		!isRecord(raw) ||
		typeof raw.id !== "number" ||
		typeof raw.title !== "string"
	)
		return null;
	const location =
		isRecord(raw.location) && typeof raw.location.name === "string"
			? raw.location.name
			: "UNKNOWN";
	const source = buildSourceEvidence(
		"greenhouse",
		`${board.company} public Greenhouse board`,
		board.publicUrl,
		observedAt,
	);
	return normalizeJobPosting({
		provider: "greenhouse",
		company: board.company,
		boardId: board.boardId,
		id: String(raw.id),
		title: raw.title,
		location,
		description: typeof raw.content === "string" ? raw.content : "",
		applicationUrl:
			typeof raw.absolute_url === "string" ? raw.absolute_url : undefined,
		originalSourceUrl:
			typeof raw.absolute_url === "string" ? raw.absolute_url : board.publicUrl,
		lastUpdatedAt: dateFromString(raw.updated_at),
		observedAt,
		source,
	});
}

export function parseLeverJob(
	raw: unknown,
	board: CuratedJobBoard,
	observedAt: string,
): JobPosting | null {
	if (
		!isRecord(raw) ||
		typeof raw.id !== "string" ||
		typeof raw.text !== "string"
	)
		return null;
	const categories = isRecord(raw.categories) ? raw.categories : {};
	const source = buildSourceEvidence(
		"lever",
		`${board.company} public Lever board`,
		board.publicUrl,
		observedAt,
	);
	return normalizeJobPosting({
		provider: "lever",
		company: board.company,
		boardId: board.boardId,
		id: raw.id,
		title: raw.text,
		location:
			typeof categories.location === "string" ? categories.location : "UNKNOWN",
		remoteMode:
			typeof raw.workplaceType === "string" ? raw.workplaceType : undefined,
		description:
			typeof raw.descriptionPlain === "string"
				? raw.descriptionPlain
				: typeof raw.description === "string"
					? raw.description
					: "",
		applicationUrl: typeof raw.applyUrl === "string" ? raw.applyUrl : undefined,
		originalSourceUrl:
			typeof raw.hostedUrl === "string" ? raw.hostedUrl : board.publicUrl,
		postedAt: dateFromMilliseconds(raw.createdAt),
		employmentType:
			typeof categories.commitment === "string"
				? categories.commitment
				: undefined,
		compensation: parseCompensation(
			raw.salaryRange,
			typeof raw.salaryDescriptionPlain === "string"
				? raw.salaryDescriptionPlain
				: undefined,
		),
		observedAt,
		source,
	});
}

export function parseAshbyJob(
	raw: unknown,
	board: CuratedJobBoard,
	observedAt: string,
): JobPosting | null {
	if (
		!isRecord(raw) ||
		typeof raw.id !== "string" ||
		typeof raw.title !== "string"
	)
		return null;
	const source = buildSourceEvidence(
		"ashby",
		`${board.company} public Ashby board`,
		board.publicUrl,
		observedAt,
	);
	return normalizeJobPosting({
		provider: "ashby",
		company: board.company,
		boardId: board.boardId,
		id: raw.id,
		title: raw.title,
		location: typeof raw.location === "string" ? raw.location : "UNKNOWN",
		remoteMode:
			typeof raw.workplaceType === "string"
				? raw.workplaceType
				: raw.isRemote === true
					? "remote"
					: undefined,
		description:
			typeof raw.descriptionPlain === "string"
				? raw.descriptionPlain
				: typeof raw.descriptionHtml === "string"
					? raw.descriptionHtml
					: "",
		applicationUrl: typeof raw.applyUrl === "string" ? raw.applyUrl : undefined,
		originalSourceUrl:
			typeof raw.jobUrl === "string" ? raw.jobUrl : board.publicUrl,
		publishedAt: dateFromString(raw.publishedAt),
		lastUpdatedAt: dateFromString(raw.updatedAt),
		employmentType:
			typeof raw.employmentType === "string" ? raw.employmentType : undefined,
		observedAt,
		source,
	});
}

export function explainJobEvidence(
	posting: JobPosting,
	profile: StudentProfile,
): { demonstrated: string[]; missing: string[]; unknown: string[] } {
	const profileText = [
		profile.strengths,
		profile.interests.join(" "),
		profile.rawResumeText ?? "",
		...profile.experiences.map(
			(experience) =>
				`${experience.title} ${experience.description} ${experience.skills.join(" ")}`,
		),
		...profile.courses.map((course) => course.title),
	].join(" ");
	const demonstrated = new Set(normalizeSkillIds(profileText, skills));
	const result = {
		demonstrated: [] as string[],
		missing: [] as string[],
		unknown: [] as string[],
	};
	for (const requirement of posting.requirements) {
		if (!requirement.skillId) {
			result.unknown.push(requirement.label);
		} else if (demonstrated.has(requirement.skillId)) {
			result.demonstrated.push(requirement.label);
		} else {
			result.missing.push(requirement.label);
		}
	}
	return result;
}
