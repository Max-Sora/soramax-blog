import assert from "node:assert/strict";
import test from "node:test";
import {
	academicRequirementStatus,
	analyzePosting,
	compareCareers,
	dedupeJobs,
	filterHardEligibility,
	generateRoadmap,
	isExpiredOpportunity,
	isStaleJob,
	normalizeCoursePlanText,
	normalizeResumeText,
	normalizeSkillIds,
	profileSkillStatus,
	validateSourceEvidence,
} from "./engine";
import { careers, sampleJobPostings, skills, sourceEvidence } from "./fixtures";
import { PRIVACY_DEFAULTS } from "./privacy";
import type { JobPosting, StudentProfile } from "./types";
import {
	validateEvidence,
	validateJobPosting,
	validateStudentProfile,
} from "./validation";

const profile: StudentProfile = {
	school: "UC Irvine",
	major: "Electrical Engineering",
	academicYear: "third",
	catalogYear: "2024-25",
	interests: ["embedded"],
	strengths: "debugging and hardware projects",
	constraints: "one evening per week",
	courses: normalizeCoursePlanText(
		"Completed: Digital Logic\nPlanned: Signals and Systems",
	),
	experiences: normalizeResumeText(
		"Sensor logger — C++, ESP32, Git, oscilloscope",
		skills,
	),
};

test("uses token boundaries when mapping short skill aliases", () => {
	assert.ok(
		normalizeSkillIds("digital logic", skills).includes("digital-logic"),
	);
	assert.equal(
		normalizeSkillIds("digital logic", skills).includes("linux-git"),
		false,
	);
	assert.equal(
		normalizeSkillIds("across the team", skills).includes("robotics-tools"),
		false,
	);
});

test("normalizes resume notes into reviewable experience records", () => {
	const experiences = normalizeResumeText(
		"Robot controller — C++ and ROS2\nLab notes — Python and experiment design",
		skills,
	);
	assert.equal(experiences.length, 2);
	assert.ok(experiences[0].skills.includes("c-cpp"));
	assert.ok(experiences[1].skills.includes("python"));
});

test("normalizes course plan without inventing official course metadata", () => {
	const courses = normalizeCoursePlanText(
		"Completed: Digital Logic\nIn progress: Signals\nMaybe later: Controls",
	);
	assert.deepEqual(
		courses.map((course) => course.status),
		["completed", "in-progress", "planned"],
	);
	assert.equal(courses[0].verified, false);
	assert.equal(courses[2].tentative, true);
	assert.match(courses[2].notes ?? "", /tentative/i);
});

test("matches requirements with explainable counts", () => {
	const analysis = analyzePosting(profile, sampleJobPostings[0], skills);
	assert.ok(analysis.matchedCount >= 2);
	assert.ok(analysis.missingCount >= 0);
	assert.match(analysis.scoreLabel, /not an employment probability/i);
});

test("filters mandatory eligibility requirements without filtering preferences", () => {
	const eligible: JobPosting = {
		...sampleJobPostings[0],
		id: "eligible",
		requirements: [
			{
				id: "work-auth",
				label: "Work authorization",
				category: "eligibility",
				importance: "mandatory",
				skillId: "linux-git",
			},
		],
	};
	const ineligible: JobPosting = {
		...eligible,
		id: "ineligible",
		requirements: [
			{
				id: "work-auth",
				label: "Work authorization",
				category: "eligibility",
				importance: "mandatory",
				skillId: "verilog",
			},
		],
	};
	assert.deepEqual(
		filterHardEligibility([eligible, ineligible], profile, skills).map(
			(job) => job.id,
		),
		["eligible"],
	);
});

test("deduplicates normalized job records", () => {
	const duplicate = {
		...sampleJobPostings[0],
		id: "duplicate",
		title: " sample embedded firmware intern ",
	};
	assert.equal(dedupeJobs([sampleJobPostings[0], duplicate]).length, 1);
});

test("marks old and malformed job timestamps stale", () => {
	const now = new Date("2026-11-04T00:00:00Z");
	assert.equal(
		isStaleJob({ ...sampleJobPostings[0], postedAt: "2026-08-01" }, now),
		true,
	);
	assert.equal(
		isStaleJob({ ...sampleJobPostings[0], postedAt: "2026-11-01" }, now),
		false,
	);
	assert.equal(
		isStaleJob({ ...sampleJobPostings[0], postedAt: "not-a-date" }, now),
		true,
	);
});

test("handles campus opportunity expiration and unknown dates", () => {
	const now = new Date("2026-11-04T00:00:00Z");
	assert.equal(
		isExpiredOpportunity({ endsAt: "2026-11-03T00:00:00Z" }, now),
		true,
	);
	assert.equal(
		isExpiredOpportunity({ endsAt: "2026-11-05T00:00:00Z" }, now),
		false,
	);
	assert.equal(isExpiredOpportunity({}, now), false);
});

test("keeps privacy and submission defaults safe", () => {
	assert.equal(PRIVACY_DEFAULTS.persistLocally, false);
	assert.equal(PRIVACY_DEFAULTS.sendPrivateDataToAi, false);
	assert.equal(PRIVACY_DEFAULTS.autoSubmitApplications, false);
});

test("rejects malformed nested profile, job, and evidence data", () => {
	assert.equal(
		validateStudentProfile({
			...profile,
			experiences: [{ title: "missing fields" }],
		}).ok,
		false,
	);
	assert.equal(
		validateStudentProfile({
			...profile,
			courses: [
				{ id: "course-1", title: "Bad", status: "planned", verified: "yes" },
			],
		}).ok,
		false,
	);
	assert.equal(
		validateJobPosting({
			...sampleJobPostings[0],
			retrievedAt: "not-a-date",
			requirements: [{ id: "bad" }],
		}).ok,
		false,
	);
	assert.equal(
		validateEvidence({
			id: "source",
			label: "Bad date",
			kind: "official",
			retrievedAt: "not-a-date",
		}).ok,
		false,
	);
});

test("keeps missing academic source data unknown", () => {
	assert.equal(academicRequirementStatus(undefined, "2024-25"), "unknown");
	assert.equal(
		academicRequirementStatus(
			sourceEvidence.find((source) => source.id === "uci-engineering"),
			"",
		),
		"unknown",
	);
	assert.equal(
		academicRequirementStatus(
			sourceEvidence.find((source) => source.id === "uci-engineering"),
			"2024-25",
		),
		"verified",
	);
	assert.equal(
		validateSourceEvidence({ id: "x", label: "Unknown", kind: "unknown" }),
		true,
	);
});

test("generates a bounded roadmap and recalculates when career goal changes", () => {
	const embedded = generateRoadmap(
		profile,
		careers.find((career) => career.id === "embedded-systems")!,
		skills,
		{ workload: "light" },
	);
	const research = generateRoadmap(
		profile,
		careers.find((career) => career.id === "undergraduate-research")!,
		skills,
		{ workload: "light" },
	);
	assert.ok(embedded.length <= 5);
	assert.notDeepEqual(
		embedded.map((action) => action.title),
		research.map((action) => action.title),
	);
	assert.ok(embedded.every((action) => action.why.length > 20));
});

test("distinguishes partial evidence from demonstrated evidence", () => {
	const partialProfile = {
		...profile,
		interests: ["python"],
		experiences: [],
		courses: [],
	};
	assert.equal(profileSkillStatus(partialProfile, "python", skills), "partial");
	assert.equal(profileSkillStatus(profile, "c-cpp", skills), "matched");
});

test("keeps roadmap effort inside the declared weekly budget", () => {
	const actions = generateRoadmap(
		{ ...profile, weeklyHours: 1 },
		careers[0]!,
		skills,
		{ workload: "light", weeklyHours: 1, horizonWeeks: 4 },
	);
	const hours = actions.reduce(
		(total, action) => total + (action.estimatedHours ?? 0),
		0,
	);
	assert.ok(hours <= 4);
});
