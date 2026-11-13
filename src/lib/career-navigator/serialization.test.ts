import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_PROFILE } from "./engine";
import { sampleJobPostings } from "./fixtures";
import {
	type CareerNavigatorDraft,
	roadmapToMarkdown,
	validateCareerNavigatorDraft,
} from "./serialization";

const draft: CareerNavigatorDraft = {
	profile: {
		...EMPTY_PROFILE,
		weeklyHours: 5,
		targetRegion: "Irvine",
		workType: "hybrid",
	},
	selectedCareerId: "embedded-systems",
	roadmapActions: [],
	applications: [],
	jobText: "",
	jobLocation: "Irvine",
	workload: "balanced",
	activePosting: sampleJobPostings[0]!,
};

test("validates a complete draft and rejects corrupted nested data", () => {
	assert.equal(validateCareerNavigatorDraft(draft).ok, true);
	const invalid = validateCareerNavigatorDraft({
		...draft,
		profile: { ...draft.profile, courses: [{ id: "bad" }] },
	});
	assert.equal(invalid.ok, false);
	assert.ok(invalid.errors.some((error) => error.startsWith("profile:")));
});

test("exports a readable roadmap markdown document", () => {
	const markdown = roadmapToMarkdown({
		...draft,
		roadmapActions: [
			{
				id: "a",
				title: "Build a test project",
				horizon: "now",
				kind: "project",
				why: "Create evidence",
				linkedSkillIds: ["python"],
				linkedRequirementIds: [],
				effort: "moderate",
				priority: 1,
				status: "suggested",
				estimatedHours: 6,
				deliverable: "A repository",
				completionEvidence: "A short test log",
			},
		],
	});
	assert.match(markdown, /# Career Navigator Plan/);
	assert.match(markdown, /Build a test project/);
	assert.match(markdown, /Completion evidence/);
});
