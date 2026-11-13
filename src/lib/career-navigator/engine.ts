import type {
	AcademicYear,
	CareerGoal,
	CareerMatch,
	CourseRecord,
	CourseStatus,
	JobPosting,
	JobRequirement,
	MatchAnalysis,
	ProjectExperience,
	RequirementMatch,
	RoadmapAction,
	RoadmapOptions,
	Skill,
	SourceEvidence,
	StudentProfile,
} from "./types";

export const EMPTY_PROFILE: StudentProfile = {
	school: "UC Irvine",
	major: "Electrical Engineering",
	academicYear: "undecided",
	catalogYear: "",
	interests: [],
	tools: [],
	strengths: "",
	constraints: "",
	courses: [],
	experiences: [],
};

export function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[–—]/g, "-")
		.replace(/[^a-z0-9+#./ -]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function containsAlias(normalizedText: string, alias: string): boolean {
	const normalizedAlias = normalizeText(alias);
	if (!normalizedAlias) return false;
	const escapedAlias = normalizedAlias
		.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		.replace(/\s+/g, "\\s+");
	return new RegExp(`(?:^|[^a-z0-9])${escapedAlias}(?=$|[^a-z0-9])`).test(
		normalizedText,
	);
}

export function normalizeSkillIds(text: string, skills: Skill[]): string[] {
	const normalized = normalizeText(text);
	return skills
		.filter((skill) =>
			skill.aliases.some((alias) => containsAlias(normalized, alias)),
		)
		.map((skill) => skill.id);
}

export function normalizeResumeText(
	text: string,
	skills: Skill[],
): ProjectExperience[] {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.replace(/^[-*•]\s*/, "").trim())
		.filter(Boolean);
	if (lines.length === 0) return [];

	return lines.slice(0, 12).map((line, index) => ({
		id: `resume-line-${index + 1}`,
		title: line.length > 70 ? `${line.slice(0, 67)}...` : line,
		description: line,
		experienceType: /research|lab|paper|experiment/i.test(line)
			? "research"
			: "project",
		skills: normalizeSkillIds(line, skills),
	}));
}

export function normalizeCoursePlanText(text: string): CourseRecord[] {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.replace(/^[-*•]\s*/, "").trim())
		.filter(Boolean);

	return lines.slice(0, 40).map((line, index) => {
		const tentative =
			/maybe\s+later|possibly|consider(?:ed)?|if\s+time|tentative/i.test(line);
		const status: CourseStatus =
			/complete|completed|taken|finished|passed/i.test(line)
				? "completed"
				: /in.?progress|current|enrolled/i.test(line)
					? "in-progress"
					: tentative ||
							/planned|plan|future|later|next|fall|winter|spring|summer/i.test(
								line,
							)
						? "planned"
						: "unknown";
		return {
			id: `course-${index + 1}`,
			title: line,
			status,
			...(tentative
				? {
						tentative: true,
						notes: "Tentative user note; confirm before scheduling.",
					}
				: {}),
			verified: false,
		};
	});
}

function profileSkillIds(
	profile: StudentProfile,
	skills: Skill[],
): Set<string> {
	const textParts = [
		profile.strengths,
		profile.interests.join(" "),
		...(profile.tools ?? []),
		profile.rawResumeText ?? "",
		...profile.experiences.flatMap((experience) => [
			experience.title,
			experience.description,
			experience.skills.join(" "),
		]),
		...profile.courses.map((course) => course.title),
	];
	return new Set(normalizeSkillIds(textParts.join(" "), skills));
}

export function profileSkillStatus(
	profile: StudentProfile,
	skillId: string,
	skills: Skill[],
): "matched" | "partial" | "missing" {
	const verifiedEvidence = [
		...profile.experiences.flatMap((experience) => [
			experience.title,
			experience.description,
			experience.skills.join(" "),
		]),
		...profile.courses
			.filter(
				(course) =>
					course.status === "completed" || course.status === "in-progress",
			)
			.map((course) => course.title),
	].join(" ");
	if (normalizeSkillIds(verifiedEvidence, skills).includes(skillId))
		return "matched";
	const supportingEvidence = [
		...profile.interests,
		...(profile.tools ?? []),
		profile.strengths,
		profile.rawResumeText ?? "",
	].join(" ");
	return normalizeSkillIds(supportingEvidence, skills).includes(skillId)
		? "partial"
		: "missing";
}

export function compareCareers(
	profile: StudentProfile,
	careers: CareerGoal[],
	skills: Skill[],
): CareerMatch[] {
	const demonstrated = profileSkillIds(profile, skills);
	return careers.map((career) => {
		const matchedSkillIds = career.skillIds.filter((skillId) =>
			demonstrated.has(skillId),
		);
		const missingSkillIds = career.skillIds.filter(
			(skillId) => !demonstrated.has(skillId),
		);
		const ratio =
			career.skillIds.length === 0
				? 0
				: matchedSkillIds.length / career.skillIds.length;
		return {
			career,
			matchedSkillIds,
			missingSkillIds,
			matchLabel:
				ratio >= 0.6
					? "stronger-signal"
					: ratio >= 0.3
						? "developing-signal"
						: "explore-more",
			explanation:
				matchedSkillIds.length > 0
					? `Your current notes show ${matchedSkillIds.length} of ${career.skillIds.length} framework skills. This is a planning signal, not a prediction of hiring or fit.`
					: "No mapped evidence yet. That is a reason to explore, not a negative judgment.",
		};
	});
}

function statusForRequirement(
	requirement: JobRequirement,
	profile: StudentProfile,
	skills: Skill[],
): RequirementMatch["status"] {
	if (!requirement.skillId) return "unknown";
	return profileSkillStatus(profile, requirement.skillId, skills);
}

export function filterHardEligibility(
	postings: JobPosting[],
	profile: StudentProfile,
	skills: Skill[],
): JobPosting[] {
	return postings.filter((posting) => {
		const eligibilityRequirements = posting.requirements.filter(
			(requirement) =>
				requirement.category === "eligibility" &&
				requirement.importance === "mandatory",
		);
		if (eligibilityRequirements.length === 0) return true;
		const demonstrated = profileSkillIds(profile, skills);
		return eligibilityRequirements.every(
			(requirement) =>
				requirement.skillId && demonstrated.has(requirement.skillId),
		);
	});
}

export function academicRequirementStatus(
	source: SourceEvidence | undefined,
	catalogYear: string,
): "verified" | "unknown" {
	return source?.kind === "official" && source.url && catalogYear.trim()
		? "verified"
		: "unknown";
}

export function analyzePosting(
	profile: StudentProfile,
	posting: JobPosting,
	skills: Skill[],
): MatchAnalysis {
	const matches: RequirementMatch[] = posting.requirements.map(
		(requirement) => {
			const status = statusForRequirement(requirement, profile, skills);
			return {
				requirement,
				status,
				evidence:
					status === "matched"
						? "Mapped to a skill or experience in the current local profile. Review the evidence before relying on it."
						: status === "partial"
							? "A related interest, tool, or unverified note was found. Add a concrete project, course, or experience before treating this as demonstrated."
							: status === "missing"
								? "Not found in the current local profile; absence here does not prove the skill is absent."
								: "The requirement could not be mapped safely without authoritative or user-provided detail.",
			};
		},
	);
	const scored = matches.filter((match) => match.status !== "unknown");
	const weightedTotal = scored.reduce(
		(sum, match) =>
			sum + (match.requirement.importance === "mandatory" ? 2 : 1),
		0,
	);
	const weightedMatched = scored.reduce(
		(sum, match) =>
			sum +
			(match.status === "matched"
				? match.requirement.importance === "mandatory"
					? 2
					: 1
				: match.status === "partial"
					? match.requirement.importance === "mandatory"
						? 1
						: 0.5
					: 0),
		0,
	);
	const explainableScore =
		weightedTotal === 0
			? 0
			: Math.round((weightedMatched / weightedTotal) * 100);
	return {
		posting,
		matches,
		matchedCount: matches.filter((match) => match.status === "matched").length,
		partialCount: matches.filter((match) => match.status === "partial").length,
		missingCount: matches.filter((match) => match.status === "missing").length,
		unknownCount: matches.filter((match) => match.status === "unknown").length,
		explainableScore,
		scoreLabel: "Evidence coverage (not an employment probability)",
	};
}

export function generateRoadmap(
	profile: StudentProfile,
	career: CareerGoal,
	skills: Skill[],
	options: RoadmapOptions = { workload: "balanced" },
	posting?: JobPosting,
): RoadmapAction[] {
	const demonstrated = profileSkillIds(profile, skills);
	const missing = career.skillIds.filter(
		(skillId) => !demonstrated.has(skillId),
	);
	const matches = posting
		? analyzePosting(profile, posting, skills)
		: undefined;
	const actions: RoadmapAction[] = [];
	const cap =
		options.workload === "light" ? 3 : options.workload === "stretch" ? 8 : 5;
	const horizonWeeks =
		options.horizonWeeks ??
		(options.workload === "light"
			? 4
			: options.workload === "stretch"
				? 12
				: 8);
	const weeklyHours = Math.max(
		1,
		options.weeklyHours ?? profile.weeklyHours ?? 5,
	);
	const availableHours = Math.max(1, Math.round(weeklyHours * horizonWeeks));

	actions.push({
		id: `career-${career.id}-conversation`,
		title:
			career.kind === "research"
				? "Contact one lab or faculty mentor with a focused question"
				: "Have one career conversation with a practitioner or advisor",
		horizon: "now",
		kind: career.kind === "research" ? "research" : "campus-resource",
		why: "A conversation tests whether the day-to-day work matches your interests before you commit substantial time.",
		linkedSkillIds: [],
		linkedRequirementIds: [],
		effort: "light",
		estimatedHours: 1,
		priority: 1,
		status: "suggested",
		deliverable: "A short note with one question answered and one next action.",
		completionEvidence: "Save the conversation date and your own notes.",
	});

	const unknownRequirementIds =
		matches?.matches
			.filter((match) => match.status === "unknown")
			.map((match) => match.requirement.id) ?? [];
	if (unknownRequirementIds.length > 0) {
		actions.push({
			id: `job-${career.id}-unknown-requirements`,
			title:
				"Review unclassified job requirements before choosing a learning plan",
			horizon: "now",
			kind: "reflection",
			why: "These requirements were present in the selected job text but could not be mapped safely to the current skill vocabulary. Review the original evidence instead of treating UNKNOWN as missing or matched.",
			linkedSkillIds: [],
			linkedRequirementIds: unknownRequirementIds,
			effort: "light",
			estimatedHours: 1,
			priority: 2,
			status: "suggested",
			deliverable:
				"A short note confirming which unknown requirements matter and which need advisor or recruiter clarification.",
			completionEvidence: "Link or quote the original requirement evidence.",
		});
	}

	if (profile.courses.length === 0) {
		actions.push({
			id: `career-${career.id}-course-plan`,
			title:
				"Enter your current course plan and catalog year for a safer comparison",
			horizon: "now",
			kind: "course",
			why: "Without a user-provided plan and catalog year, this tool cannot distinguish official degree rules from general preparation ideas.",
			linkedSkillIds: [],
			linkedRequirementIds: [],
			effort: "light",
			estimatedHours: 2,
			priority: 2,
			status: "suggested",
			deliverable:
				"A reviewed list of current, planned, and uncertain courses.",
			completionEvidence:
				"Mark each course status and record the catalog year used.",
			alternatives: [
				"Paste a counselor plan or type only course titles; no official requirement is inferred.",
			],
		});
	}

	missing.slice(0, cap).forEach((skillId, index) => {
		const skill = skills.find((item) => item.id === skillId);
		if (!skill) return;
		const linkedRequirementIds =
			matches?.matches
				.filter(
					(match) =>
						match.requirement.skillId === skillId && match.status === "missing",
				)
				.map((match) => match.requirement.id) ?? [];
		actions.push({
			id: `skill-${career.id}-${skillId}`,
			title: `Create evidence for ${skill.name}`,
			horizon: index < 2 ? "next-quarter" : "later",
			kind:
				skillId === "literature-review" || skillId === "experimental-design"
					? "research"
					: "project",
			why: `This closes a visible gap in the ${career.title} framework${linkedRequirementIds.length > 0 ? " and connects to a selected requirement" : ""}. Evidence can come from a course, project, lab, or other experience—not only a job.`,
			linkedSkillIds: [skillId],
			linkedRequirementIds,
			effort: index < 2 ? "moderate" : "substantial",
			estimatedHours: index < 2 ? 6 : 10,
			prerequisiteActionIds:
				index > 0 ? [`skill-${career.id}-${missing[index - 1]}`] : [],
			priority: index + 3,
			status: "suggested",
			deliverable: `A small, reviewable artifact demonstrating ${skill.name}.`,
			completionEvidence:
				"Link a project note, commit, measurement, report, or mentor review.",
			alternatives: [
				`Try a smaller ${skill.name} exercise if a full project does not fit this quarter.`,
				"Ask a faculty member, mentor, or campus resource what beginner evidence is appropriate.",
			],
		});
	});

	const selected: RoadmapAction[] = [];
	let usedHours = 0;
	for (const action of actions.sort((a, b) => a.priority - b.priority)) {
		const hours = Math.max(1, action.estimatedHours ?? 1);
		if (usedHours + hours > availableHours) continue;
		selected.push(action);
		usedHours += hours;
	}
	const maxActions =
		options.workload === "light" ? 5 : options.workload === "stretch" ? 10 : 7;
	const selectedIds = new Set(
		selected.slice(0, maxActions).map((action) => action.id),
	);
	return selected.slice(0, maxActions).map((action, index) => ({
		...action,
		priority: index + 1,
		prerequisiteActionIds: action.prerequisiteActionIds?.filter((id) =>
			selectedIds.has(id),
		),
	}));
}

export function dedupeJobs(postings: JobPosting[]): JobPosting[] {
	const seen = new Set<string>();
	return postings.filter((posting) => {
		const key = `${normalizeText(posting.company)}|${normalizeText(posting.title)}|${posting.url ?? posting.applicationUrl ?? ""}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function isStaleJob(
	posting: JobPosting,
	now: Date = new Date(),
	maxAgeDays = 45,
): boolean {
	const dateValue =
		posting.postedAt ?? posting.publishedAt ?? posting.retrievedAt;
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return true;
	return now.getTime() - date.getTime() > maxAgeDays * 86_400_000;
}

export function isExpiredOpportunity(
	opportunity: { endsAt?: string },
	now: Date = new Date(),
): boolean {
	if (!opportunity.endsAt) return false;
	const end = new Date(opportunity.endsAt);
	return Number.isNaN(end.getTime()) || end.getTime() < now.getTime();
}

export function validateSourceEvidence(source: SourceEvidence): boolean {
	return Boolean(
		source.id &&
			source.label &&
			["official", "sample", "user-provided", "unknown"].includes(source.kind),
	);
}

export function validateProfile(value: unknown): value is StudentProfile {
	if (!value || typeof value !== "object") return false;
	const profile = value as Partial<StudentProfile>;
	return (
		typeof profile.school === "string" &&
		typeof profile.major === "string" &&
		typeof profile.academicYear === "string" &&
		typeof profile.catalogYear === "string" &&
		Array.isArray(profile.interests) &&
		Array.isArray(profile.courses) &&
		Array.isArray(profile.experiences)
	);
}

export function updateCourseStatus(
	courses: CourseRecord[],
	id: string,
	status: CourseStatus,
): CourseRecord[] {
	return courses.map((course) =>
		course.id === id ? { ...course, status } : course,
	);
}

export function mergeExperience(
	profile: StudentProfile,
	text: string,
	skills: Skill[],
): StudentProfile {
	const additions = normalizeResumeText(text, skills);
	return {
		...profile,
		rawResumeText: text,
		experiences: [
			...profile.experiences.filter(
				(experience) => !experience.id.startsWith("resume-line-"),
			),
			...additions,
		],
	};
}

export function sourceLabel(sources: SourceEvidence[], id?: string): string {
	return sources.find((source) => source.id === id)?.label ?? "UNKNOWN source";
}

export function academicYearLabel(year: AcademicYear): string {
	return {
		first: "1st year",
		second: "2nd year",
		third: "3rd year",
		fourth: "4th year",
		graduate: "Graduate",
		undecided: "Not sure yet",
	}[year];
}

export function courseStatusLabel(status: CourseStatus): string {
	return {
		completed: "Completed",
		"in-progress": "In progress",
		planned: "Planned",
		unknown: "Needs review",
	}[status];
}

export function ensureUniqueIds(profile: StudentProfile): StudentProfile {
	return {
		...profile,
		courses: profile.courses.map((course, index) => ({
			...course,
			id: course.id || `course-${index + 1}`,
		})),
		experiences: profile.experiences.map((experience, index) => ({
			...experience,
			id: experience.id || `experience-${index + 1}`,
		})),
	};
}
