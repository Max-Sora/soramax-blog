import type {
	AcademicYear,
	CourseRecord,
	CourseStatus,
	JobPosting,
	JobRequirement,
	ProjectExperience,
	SourceEvidence,
	StudentProfile,
} from "./types";

export interface ValidationResult<T> {
	ok: boolean;
	value?: T;
	errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isDateString(value: unknown): value is string {
	return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isAcademicYear(value: unknown): value is AcademicYear {
	return [
		"first",
		"second",
		"third",
		"fourth",
		"graduate",
		"undecided",
	].includes(String(value));
}

function isCourseStatus(value: unknown): value is CourseStatus {
	return ["completed", "in-progress", "planned", "unknown"].includes(
		String(value),
	);
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

function isCourseRecord(value: unknown): value is CourseRecord {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		isCourseStatus(value.status) &&
		(value.term === undefined || typeof value.term === "string") &&
		(value.notes === undefined || typeof value.notes === "string") &&
		(value.tentative === undefined || typeof value.tentative === "boolean") &&
		typeof value.verified === "boolean"
	);
}

function isCourseRecordArray(value: unknown): value is CourseRecord[] {
	return Array.isArray(value) && value.every(isCourseRecord);
}

function isExperience(value: unknown): value is ProjectExperience {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		typeof value.description === "string" &&
		["project", "research", "internship", "extracurricular", "other"].includes(
			String(value.experienceType),
		) &&
		isStringArray(value.skills)
	);
}

function isExperienceArray(value: unknown): value is ProjectExperience[] {
	return Array.isArray(value) && value.every(isExperience);
}

function isRequirement(value: unknown): value is JobRequirement {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.label === "string" &&
		["technical", "academic", "communication", "eligibility", "other"].includes(
			String(value.category),
		) &&
		["mandatory", "preferred", "unknown"].includes(String(value.importance)) &&
		(value.skillId === undefined || typeof value.skillId === "string") &&
		(value.evidenceId === undefined || typeof value.evidenceId === "string") &&
		(value.evidenceText === undefined ||
			typeof value.evidenceText === "string") &&
		(value.extractionMethod === undefined ||
			["explicit", "user-provided", "unknown"].includes(
				String(value.extractionMethod),
			)) &&
		(value.note === undefined || typeof value.note === "string")
	);
}

function isRequirementArray(value: unknown): value is JobRequirement[] {
	return Array.isArray(value) && value.every(isRequirement);
}

function isStudentProfile(value: unknown): value is StudentProfile {
	if (!isRecord(value)) return false;
	return (
		typeof value.school === "string" &&
		typeof value.major === "string" &&
		isAcademicYear(value.academicYear) &&
		typeof value.catalogYear === "string" &&
		(value.expectedGraduation === undefined ||
			typeof value.expectedGraduation === "string") &&
		(value.weeklyHours === undefined ||
			(typeof value.weeklyHours === "number" &&
				Number.isFinite(value.weeklyHours) &&
				value.weeklyHours >= 0 &&
				value.weeklyHours <= 80)) &&
		(value.targetRegion === undefined ||
			typeof value.targetRegion === "string") &&
		(value.workType === undefined ||
			["remote", "hybrid", "onsite", "unknown"].includes(
				String(value.workType),
			)) &&
		(value.targetDeadline === undefined ||
			value.targetDeadline === "" ||
			isDateString(value.targetDeadline)) &&
		isStringArray(value.interests) &&
		(value.tools === undefined || isStringArray(value.tools)) &&
		typeof value.strengths === "string" &&
		typeof value.constraints === "string" &&
		isCourseRecordArray(value.courses) &&
		isExperienceArray(value.experiences) &&
		(value.rawResumeText === undefined ||
			typeof value.rawResumeText === "string") &&
		(value.rawCoursePlanText === undefined ||
			typeof value.rawCoursePlanText === "string")
	);
}

function isCompensation(value: unknown): boolean {
	if (!isRecord(value)) return false;
	return (
		(value.min === undefined || typeof value.min === "number") &&
		(value.max === undefined || typeof value.max === "number") &&
		(value.currency === undefined || typeof value.currency === "string") &&
		(value.interval === undefined || typeof value.interval === "string") &&
		(value.text === undefined || typeof value.text === "string")
	);
}

function isJobPosting(value: unknown): value is JobPosting {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		typeof value.company === "string" &&
		typeof value.location === "string" &&
		isDateString(value.retrievedAt) &&
		(value.postedAt === undefined || isDateString(value.postedAt)) &&
		(value.publishedAt === undefined || isDateString(value.publishedAt)) &&
		(value.url === undefined || typeof value.url === "string") &&
		(value.applicationUrl === undefined ||
			typeof value.applicationUrl === "string") &&
		(value.lastUpdatedAt === undefined || isDateString(value.lastUpdatedAt)) &&
		(value.observedAt === undefined || isDateString(value.observedAt)) &&
		(value.provider === undefined ||
			["greenhouse", "lever", "ashby", "user-provided", "sample"].includes(
				String(value.provider),
			)) &&
		(value.remoteMode === undefined ||
			["remote", "hybrid", "onsite", "unknown"].includes(
				String(value.remoteMode),
			)) &&
		(value.employmentType === undefined ||
			typeof value.employmentType === "string") &&
		(value.internshipEligibility === undefined ||
			["explicit-yes", "explicit-no", "unknown"].includes(
				String(value.internshipEligibility),
			)) &&
		(value.description === undefined ||
			typeof value.description === "string") &&
		(value.preferredQualifications === undefined ||
			isStringArray(value.preferredQualifications)) &&
		(value.compensation === undefined || isCompensation(value.compensation)) &&
		(value.freshnessStatus === undefined ||
			["fresh", "stale", "unknown"].includes(String(value.freshnessStatus))) &&
		isRequirementArray(value.requirements) &&
		typeof value.sourceEvidenceId === "string" &&
		(value.isSample === undefined || typeof value.isSample === "boolean")
	);
}

function isSourceEvidence(value: unknown): value is SourceEvidence {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === "string" &&
		typeof value.label === "string" &&
		["official", "sample", "user-provided", "unknown"].includes(
			String(value.kind),
		) &&
		(value.url === undefined || typeof value.url === "string") &&
		(value.retrievedAt === undefined || isDateString(value.retrievedAt)) &&
		(value.publishedAt === undefined || isDateString(value.publishedAt)) &&
		(value.appliesTo === undefined || typeof value.appliesTo === "string") &&
		(value.note === undefined || typeof value.note === "string")
	);
}

export function validateStudentProfile(
	value: unknown,
): ValidationResult<StudentProfile> {
	if (!isRecord(value))
		return { ok: false, errors: ["Profile must be an object."] };
	const errors: string[] = [];
	if (typeof value.school !== "string") errors.push("school must be text");
	if (typeof value.major !== "string") errors.push("major must be text");
	if (!isAcademicYear(value.academicYear))
		errors.push("academicYear is invalid");
	if (typeof value.catalogYear !== "string")
		errors.push("catalogYear must be text");
	if (
		value.expectedGraduation !== undefined &&
		typeof value.expectedGraduation !== "string"
	)
		errors.push("expectedGraduation must be text");
	if (
		value.weeklyHours !== undefined &&
		(typeof value.weeklyHours !== "number" ||
			!Number.isFinite(value.weeklyHours) ||
			value.weeklyHours < 0 ||
			value.weeklyHours > 80)
	)
		errors.push("weeklyHours must be between 0 and 80");
	if (
		value.targetRegion !== undefined &&
		typeof value.targetRegion !== "string"
	)
		errors.push("targetRegion must be text");
	if (
		value.workType !== undefined &&
		!["remote", "hybrid", "onsite", "unknown"].includes(String(value.workType))
	)
		errors.push("workType is invalid");
	if (
		value.targetDeadline !== undefined &&
		value.targetDeadline !== "" &&
		!isDateString(value.targetDeadline)
	)
		errors.push("targetDeadline must be a date");
	if (!isStringArray(value.interests))
		errors.push("interests must be a list of text");
	if (value.tools !== undefined && !isStringArray(value.tools))
		errors.push("tools must be a list of text");
	if (typeof value.strengths !== "string")
		errors.push("strengths must be text");
	if (typeof value.constraints !== "string")
		errors.push("constraints must be text");
	if (!isCourseRecordArray(value.courses))
		errors.push("courses contain an invalid record");
	if (!isExperienceArray(value.experiences))
		errors.push("experiences contain an invalid record");
	if (
		value.rawResumeText !== undefined &&
		typeof value.rawResumeText !== "string"
	)
		errors.push("rawResumeText must be text");
	if (
		value.rawCoursePlanText !== undefined &&
		typeof value.rawCoursePlanText !== "string"
	)
		errors.push("rawCoursePlanText must be text");
	if (errors.length === 0 && isStudentProfile(value))
		return { ok: true, value, errors: [] };
	return {
		ok: false,
		errors: errors.length > 0 ? errors : ["Profile has an invalid shape."],
	};
}

export function validateJobPosting(
	value: unknown,
): ValidationResult<JobPosting> {
	if (!isRecord(value))
		return { ok: false, errors: ["Job posting must be an object."] };
	const errors: string[] = [];
	if (typeof value.id !== "string") errors.push("id must be text");
	if (typeof value.title !== "string") errors.push("title must be text");
	if (typeof value.company !== "string") errors.push("company must be text");
	if (typeof value.location !== "string") errors.push("location must be text");
	if (!isDateString(value.retrievedAt))
		errors.push("retrievedAt must be a parseable date string");
	if (value.postedAt !== undefined && !isDateString(value.postedAt))
		errors.push("postedAt must be a parseable date string");
	if (value.publishedAt !== undefined && !isDateString(value.publishedAt))
		errors.push("publishedAt must be a parseable date string");
	if (value.url !== undefined && typeof value.url !== "string")
		errors.push("url must be text");
	if (
		value.applicationUrl !== undefined &&
		typeof value.applicationUrl !== "string"
	)
		errors.push("applicationUrl must be text");
	if (!isRequirementArray(value.requirements))
		errors.push("requirements contain an invalid record");
	if (typeof value.sourceEvidenceId !== "string")
		errors.push("sourceEvidenceId is required");
	if (value.isSample !== undefined && typeof value.isSample !== "boolean")
		errors.push("isSample must be boolean");
	if (errors.length === 0 && isJobPosting(value))
		return { ok: true, value, errors: [] };
	return {
		ok: false,
		errors: errors.length > 0 ? errors : ["Job posting has an invalid shape."],
	};
}

export function validateEvidence(
	value: unknown,
): ValidationResult<SourceEvidence> {
	if (!isRecord(value))
		return { ok: false, errors: ["Evidence must be an object."] };
	const errors: string[] = [];
	if (typeof value.id !== "string") errors.push("id must be text");
	if (typeof value.label !== "string") errors.push("label must be text");
	if (
		!["official", "sample", "user-provided", "unknown"].includes(
			String(value.kind),
		)
	)
		errors.push("kind must be a supported evidence type");
	if (value.url !== undefined && typeof value.url !== "string")
		errors.push("url must be text");
	if (value.retrievedAt !== undefined && !isDateString(value.retrievedAt))
		errors.push("retrievedAt must be a parseable date string");
	if (value.publishedAt !== undefined && !isDateString(value.publishedAt))
		errors.push("publishedAt must be a parseable date string");
	if (value.appliesTo !== undefined && typeof value.appliesTo !== "string")
		errors.push("appliesTo must be text");
	if (value.note !== undefined && typeof value.note !== "string")
		errors.push("note must be text");
	if (errors.length === 0 && isSourceEvidence(value))
		return { ok: true, value, errors: [] };
	return {
		ok: false,
		errors: errors.length > 0 ? errors : ["Evidence has an invalid shape."],
	};
}
