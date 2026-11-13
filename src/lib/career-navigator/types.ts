export type NavigatorMode = "explore" | "build" | "apply";
export type AcademicYear =
	| "first"
	| "second"
	| "third"
	| "fourth"
	| "graduate"
	| "undecided";
export type CourseStatus = "completed" | "in-progress" | "planned" | "unknown";
export type RequirementImportance = "mandatory" | "preferred" | "unknown";
export type RequirementCategory =
	| "technical"
	| "academic"
	| "communication"
	| "eligibility"
	| "other";
export type EvidenceKind = "official" | "sample" | "user-provided" | "unknown";
export type RoadmapHorizon = "now" | "next-quarter" | "later";
export type RoadmapStatus = "suggested" | "accepted" | "done" | "rejected";
export type ApplicationStatus =
	| "saved"
	| "planning"
	| "applied"
	| "interviewing"
	| "rejected"
	| "offered";
export type JobProvider =
	| "greenhouse"
	| "lever"
	| "ashby"
	| "user-provided"
	| "sample";
export type JobFreshness = "fresh" | "stale" | "unknown";
export type WorkMode = "remote" | "hybrid" | "onsite" | "unknown";
export type InternshipEligibility = "explicit-yes" | "explicit-no" | "unknown";

export interface SourceEvidence {
	id: string;
	label: string;
	kind: EvidenceKind;
	url?: string;
	retrievedAt?: string;
	publishedAt?: string;
	appliesTo?: string;
	note?: string;
}

export interface Skill {
	id: string;
	name: string;
	aliases: string[];
	description: string;
}

export interface JobRequirement {
	id: string;
	label: string;
	skillId?: string;
	category: RequirementCategory;
	importance: RequirementImportance;
	evidenceId?: string;
	evidenceText?: string;
	extractionMethod?: "explicit" | "user-provided" | "unknown";
	note?: string;
}

export interface CompensationRange {
	min?: number;
	max?: number;
	currency?: string;
	interval?: string;
	text?: string;
}

export interface JobPosting {
	id: string;
	title: string;
	company: string;
	location: string;
	url?: string;
	applicationUrl?: string;
	postedAt?: string;
	publishedAt?: string;
	retrievedAt: string;
	lastUpdatedAt?: string;
	observedAt?: string;
	provider?: JobProvider;
	originalSourceUrl?: string;
	remoteMode?: WorkMode;
	employmentType?: string;
	internshipEligibility?: InternshipEligibility;
	description?: string;
	preferredQualifications?: string[];
	compensation?: CompensationRange;
	freshnessStatus?: JobFreshness;
	requirements: JobRequirement[];
	sourceEvidenceId: string;
	isSample?: boolean;
}

export interface CourseRecord {
	id: string;
	title: string;
	status: CourseStatus;
	term?: string;
	notes?: string;
	tentative?: boolean;
	verified: boolean;
}

export interface ProjectExperience {
	id: string;
	title: string;
	description: string;
	experienceType:
		| "project"
		| "research"
		| "internship"
		| "extracurricular"
		| "other";
	skills: string[];
}

export interface StudentProfile {
	school: string;
	major: string;
	academicYear: AcademicYear;
	catalogYear: string;
	expectedGraduation?: string;
	weeklyHours?: number;
	targetRegion?: string;
	workType?: WorkMode;
	targetDeadline?: string;
	interests: string[];
	tools?: string[];
	strengths: string;
	constraints: string;
	courses: CourseRecord[];
	experiences: ProjectExperience[];
	rawResumeText?: string;
	rawCoursePlanText?: string;
}

export interface CareerGoal {
	id: string;
	title: string;
	kind: "career" | "research";
	summary: string;
	responsibilities: string[];
	skillIds: string[];
	starterActions: string[];
	evidenceIds: string[];
}

export interface CareerMatch {
	career: CareerGoal;
	matchedSkillIds: string[];
	missingSkillIds: string[];
	matchLabel: "stronger-signal" | "developing-signal" | "explore-more";
	explanation: string;
}

export interface RequirementMatch {
	requirement: JobRequirement;
	status: "matched" | "partial" | "missing" | "unknown";
	evidence: string;
}

export interface MatchAnalysis {
	posting: JobPosting;
	matches: RequirementMatch[];
	matchedCount: number;
	partialCount: number;
	missingCount: number;
	unknownCount: number;
	explainableScore: number;
	scoreLabel: string;
}

export interface RoadmapAction {
	id: string;
	title: string;
	horizon: RoadmapHorizon;
	kind:
		| "course"
		| "project"
		| "research"
		| "application"
		| "reflection"
		| "campus-resource";
	why: string;
	linkedSkillIds: string[];
	linkedRequirementIds: string[];
	effort: "light" | "moderate" | "substantial";
	priority: number;
	status: RoadmapStatus;
	estimatedHours?: number;
	prerequisiteActionIds?: string[];
	deliverable?: string;
	completionEvidence?: string;
	alternatives?: string[];
}

export interface DegreeRequirement {
	id: string;
	label: string;
	catalogYear?: string;
	courseIds?: string[];
	units?: number;
	sourceEvidenceId?: string;
	status: "verified" | "unknown";
}

export interface AcademicPlan {
	catalogYear: string;
	courses: CourseRecord[];
	degreeRequirements?: DegreeRequirement[];
	sourceEvidenceId?: string;
}

export interface CampusOpportunity {
	id: string;
	title: string;
	description: string;
	url: string;
	sourceEvidenceId: string;
	kind: "resource" | "research" | "career" | "event";
	startsAt?: string;
	endsAt?: string;
	dateStatus?: "confirmed" | "unknown";
	lastCheckedAt?: string;
	registrationUrl?: string;
	relevantInterests?: string[];
}

export type AcademicCourse = CourseRecord;
export type ResearchOpportunity = CampusOpportunity;
export type CampusEvent = CampusOpportunity;
export type ActionItem = RoadmapAction;

export interface ApplicationRecord {
	id: string;
	company: string;
	role: string;
	location?: string;
	status: ApplicationStatus;
	url?: string;
	postedAt?: string;
	sourceUrl?: string;
	notes?: string;
	lastUpdated: string;
}

export interface CareerNavigatorData {
	skills: Skill[];
	careers: CareerGoal[];
	jobPostings: JobPosting[];
	sources: SourceEvidence[];
	campusOpportunities: CampusOpportunity[];
}

export interface RoadmapOptions {
	workload: "light" | "balanced" | "stretch";
	weeklyHours?: number;
	horizonWeeks?: number;
	now?: Date;
}
