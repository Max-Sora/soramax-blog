import assert from "node:assert/strict";
import test from "node:test";
import { demoNews, demoSources } from "./fixtures";
import {
	buildPublicKnowledge,
	demoCases,
	diagnoseHardware,
	sanitizePublicSnapshot,
	searchIntelligenceRecords,
} from "./knowledge";

test("builds one public contract with linked evidence, cases and agent runs", () => {
	const snapshot = buildPublicKnowledge(
		demoNews,
		demoSources,
		"synthetic",
		"2026-09-28T12:00:00Z",
	);
	assert.equal(snapshot.version, 1);
	assert.equal(snapshot.mode, "synthetic");
	assert.equal(snapshot.records.length, demoNews.length);
	assert.ok(snapshot.evidence.length >= demoNews.length);
	assert.equal(snapshot.cases.length, demoCases.length);
	assert.ok(snapshot.agentRuns.some((run) => run.stage === "diagnose"));
});

test("retrieves hardware cases and keeps unknowns visible", () => {
	const result = diagnoseHardware(
		"GPU black screen after driver update under load",
		demoCases,
		"2026-09-28T12:00:00Z",
	);
	assert.equal(result.status, "completed");
	assert.equal(result.device, "gpu");
	assert.equal(result.matches[0]?.caseId, "case-gpu-black-screen");
	assert.ok(result.possibleCauses.length > 0);
	assert.ok(result.steps.length > 0);
	assert.ok(result.unknowns.some((item) => item.includes("Exact component")));
});

test("empty diagnosis returns honest insufficient data", () => {
	const result = diagnoseHardware("", demoCases);
	assert.equal(result.status, "insufficient_data");
	assert.equal(result.matches.length, 0);
	assert.ok(result.unknowns.length > 0);
});

test("record search is deterministic and public sanitization removes secret-shaped values", () => {
	const snapshot = buildPublicKnowledge(demoNews, demoSources, "synthetic");
	assert.equal(
		searchIntelligenceRecords(snapshot.records, "thermal").length,
		2,
	);
	const sanitized = sanitizePublicSnapshot({
		...snapshot,
		agentRuns: [
			{
				...snapshot.agentRuns[0]!,
				redactedLog: ["api_key=do-not-publish", "C:\\private\\token.txt"],
			},
		],
	});
	assert.match(JSON.stringify(sanitized), /redacted/);
	assert.doesNotMatch(
		JSON.stringify(sanitized),
		/do-not-publish|private\\token/,
	);
});
