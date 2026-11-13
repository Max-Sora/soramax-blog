import type {
	ApplicationRecord,
	JobPosting,
	RoadmapAction,
	StudentProfile,
} from "./types";
import {
	type ValidationResult,
	validateJobPosting,
	validateStudentProfile,
} from "./validation";

export interface CareerNavigatorDraft {
	profile: StudentProfile;
	selectedCareerId: string;
	roadmapActions: RoadmapAction[];
	applications: ApplicationRecord[];
	jobText: string;
	jobLocation: string;
	workload: "light" | "balanced" | "stretch";
	activePosting: JobPosting;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isRoadmapAction(value: unknown): value is RoadmapAction {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		typeof value.why === "string" &&
		typeof value.horizon === "string" &&
		typeof value.kind === "string" &&
		typeof value.priority === "number" &&
		typeof value.status === "string" &&
		Array.isArray(value.linkedSkillIds) &&
		value.linkedSkillIds.every((id) => typeof id === "string") &&
		Array.isArray(value.linkedRequirementIds) &&
		value.linkedRequirementIds.every((id) => typeof id === "string") &&
		(value.estimatedHours === undefined ||
			(typeof value.estimatedHours === "number" &&
				Number.isFinite(value.estimatedHours))) &&
		(value.prerequisiteActionIds === undefined ||
			(Array.isArray(value.prerequisiteActionIds) &&
				value.prerequisiteActionIds.every((id) => typeof id === "string")))
	);
}

function isApplication(value: unknown): value is ApplicationRecord {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.company === "string" &&
		typeof value.role === "string" &&
		[
			"saved",
			"planning",
			"applied",
			"interviewing",
			"rejected",
			"offered",
		].includes(String(value.status)) &&
		typeof value.lastUpdated === "string" &&
		(value.url === undefined || typeof value.url === "string") &&
		(value.postedAt === undefined || typeof value.postedAt === "string") &&
		(value.sourceUrl === undefined || typeof value.sourceUrl === "string") &&
		(value.notes === undefined || typeof value.notes === "string")
	);
}

export function validateCareerNavigatorDraft(
	value: unknown,
): ValidationResult<CareerNavigatorDraft> {
	if (!isRecord(value))
		return { ok: false, errors: ["Draft must be an object."] };
	const errors: string[] = [];
	const profile = validateStudentProfile(value.profile);
	if (!profile.ok)
		errors.push(...profile.errors.map((error) => `profile: ${error}`));
	const posting = validateJobPosting(value.activePosting);
	if (!posting.ok)
		errors.push(...posting.errors.map((error) => `activePosting: ${error}`));
	if (typeof value.selectedCareerId !== "string")
		errors.push("selectedCareerId must be text");
	if (
		!Array.isArray(value.roadmapActions) ||
		!value.roadmapActions.every(isRoadmapAction)
	)
		errors.push("roadmapActions contain an invalid record");
	if (
		!Array.isArray(value.applications) ||
		!value.applications.every(isApplication)
	)
		errors.push("applications contain an invalid record");
	if (typeof value.jobText !== "string") errors.push("jobText must be text");
	if (typeof value.jobLocation !== "string")
		errors.push("jobLocation must be text");
	if (!["light", "balanced", "stretch"].includes(String(value.workload)))
		errors.push("workload is invalid");
	if (errors.length > 0 || !profile.value || !posting.value)
		return { ok: false, errors };
	return {
		ok: true,
		errors: [],
		value: {
			profile: profile.value,
			selectedCareerId: value.selectedCareerId as string,
			roadmapActions: value.roadmapActions as RoadmapAction[],
			applications: value.applications as ApplicationRecord[],
			jobText: value.jobText as string,
			jobLocation: value.jobLocation as string,
			workload: value.workload as CareerNavigatorDraft["workload"],
			activePosting: posting.value,
		},
	};
}

export function roadmapToMarkdown(draft: CareerNavigatorDraft): string {
	const lines = [
		"# Career Navigator Plan",
		"",
		`- Direction: ${draft.selectedCareerId}`,
		`- Weekly time budget: ${draft.profile.weeklyHours ?? 5} hours`,
		`- Target region: ${draft.profile.targetRegion || "Not specified"}`,
		`- Work type: ${draft.profile.workType ?? "unknown"}`,
		`- Target deadline: ${draft.profile.targetDeadline || "Not specified"}`,
		"",
		"## Roadmap",
		"",
	];
	if (draft.roadmapActions.length === 0)
		lines.push("No roadmap actions have been generated yet.", "");
	for (const action of draft.roadmapActions) {
		lines.push(
			`### ${action.priority}. ${action.title}`,
			"",
			`- Status: ${action.status}`,
			`- Horizon: ${action.horizon}`,
			`- Estimated effort: ${action.estimatedHours ?? "unknown"} hours`,
			`- Why: ${action.why}`,
		);
		if (action.deliverable) lines.push(`- Deliverable: ${action.deliverable}`);
		if (action.completionEvidence)
			lines.push(`- Completion evidence: ${action.completionEvidence}`);
		lines.push("");
	}
	lines.push("## Applications", "");
	if (draft.applications.length === 0)
		lines.push("No applications tracked yet.", "");
	for (const application of draft.applications)
		lines.push(
			`- ${application.role} at ${application.company} (${application.status})${application.sourceUrl ? ` — ${application.sourceUrl}` : ""}`,
		);
	return `${lines.join("\n").trim()}\n`;
}
