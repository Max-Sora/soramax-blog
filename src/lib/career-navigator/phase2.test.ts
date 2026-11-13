import assert from "node:assert/strict";
import test from "node:test";
import {
	uciCampusOpportunities,
	uciCampusSources,
} from "../../data/career-navigator";
import {
	deduplicateNormalizedJobs,
	EMPTY_JOB_SNAPSHOT,
	parseAshbyJob,
	parseLeverJob,
	sanitizeText,
} from "./phase2";

test("normalizes public Lever data without inventing publication dates", () => {
	const posting = parseLeverJob(
		{
			id: "lever-1",
			text: "Firmware Intern",
			categories: { location: "Irvine, CA", commitment: "Internship" },
			descriptionPlain:
				"Required: C++ and microcontroller experience. Preferred: Git.",
			hostedUrl: "https://jobs.lever.co/example/lever-1",
			applyUrl: "https://jobs.lever.co/example/lever-1/apply",
			createdAt: 1791300000000,
			workplaceType: "hybrid",
		},
		{
			provider: "lever",
			company: "Example Robotics",
			boardId: "example",
			publicUrl: "https://jobs.lever.co/example",
		},
		"2026-11-04T00:00:00.000Z",
	);
	assert.ok(posting);
	assert.equal(posting.provider, "lever");
	assert.equal(posting.internshipEligibility, "explicit-yes");
	assert.equal(posting.remoteMode, "hybrid");
	assert.equal(posting.publishedAt, undefined);
	assert.ok(
		posting.requirements.some((requirement) => requirement.skillId === "c-cpp"),
	);
});

test("normalizes public Ashby data and preserves observed versus published timestamps", () => {
	const posting = parseAshbyJob(
		{
			id: "ashby-1",
			title: "Embedded Software Intern",
			location: "Austin, TX",
			workplaceType: "OnSite",
			employmentType: "Internship",
			publishedAt: "2026-10-27T14:08:49.780Z",
			jobUrl: "https://jobs.ashbyhq.com/example/ashby-1",
			applyUrl: "https://jobs.ashbyhq.com/example/ashby-1/application",
			descriptionPlain: "C++ firmware for microcontrollers.",
		},
		{
			provider: "ashby",
			company: "Example Hardware",
			boardId: "example",
			publicUrl: "https://jobs.ashbyhq.com/example",
		},
		"2026-11-04T00:00:00.000Z",
	);
	assert.ok(posting);
	assert.equal(posting.publishedAt, "2026-10-27T14:08:49.780Z");
	assert.equal(posting.observedAt, "2026-11-04T00:00:00.000Z");
	assert.equal(posting.remoteMode, "onsite");
});

test("deduplicates normalized live records and keeps empty snapshots explicit", () => {
	const posting = parseAshbyJob(
		{
			id: "one",
			title: "Firmware Intern",
			location: "Remote",
			jobUrl: "https://jobs.ashbyhq.com/example/one",
			descriptionPlain: "C++",
		},
		{
			provider: "ashby",
			company: "Example",
			boardId: "example",
			publicUrl: "https://jobs.ashbyhq.com/example",
		},
		"2026-11-04T00:00:00.000Z",
	)!;
	assert.equal(
		deduplicateNormalizedJobs([posting, { ...posting, id: "duplicate" }])
			.length,
		1,
	);
	assert.equal(EMPTY_JOB_SNAPSHOT.status, "unavailable");
	assert.equal(EMPTY_JOB_SNAPSHOT.jobs.length, 0);
});

test("sanitizes untrusted provider HTML", () => {
	assert.equal(sanitizeText("<script>alert(1)</script><p>C++</p>"), "C++");
});

test("keeps UCI opportunity dates unknown unless confirmed by the source", () => {
	assert.ok(uciCampusSources.every((source) => source.kind === "official"));
	assert.ok(
		uciCampusOpportunities.some(
			(opportunity) =>
				opportunity.id === "uci-career-fairs-resource" &&
				opportunity.dateStatus === "unknown",
		),
	);
});
