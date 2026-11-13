import assert from "node:assert/strict";
import test from "node:test";
import { DeterministicCareerAnalysisProvider } from "./ai";
import { EMPTY_PROFILE, normalizeResumeText } from "./engine";
import { careers, sampleJobPostings, skills } from "./fixtures";

test("deterministic provider analyzes the current posting without network AI", async () => {
	const provider = new DeterministicCareerAnalysisProvider();
	const result = await provider.analyze({
		profile: {
			...EMPTY_PROFILE,
			experiences: normalizeResumeText("C++ firmware project", skills),
		},
		career: careers[0]!,
		posting: sampleJobPostings[0],
		consentToSendPrivateData: false,
		workload: { workload: "light" },
	});
	assert.equal(result.mode, "deterministic");
	assert.ok(result.match);
	assert.ok(result.roadmap.length > 0);
	assert.ok(result.notes.some((note) => /no external model/i.test(note)));
});
