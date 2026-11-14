import { test } from "node:test";
import assert from "node:assert/strict";
import { failureModes, getHardwareCase, hardwareCases, hardwareModules, symptoms, validateHardwareAtlasData } from "./hardware";

test("Hardware Atlas relation ids are internally consistent", () => {
	assert.deepEqual(validateHardwareAtlasData(), []);
});

test("Hardware Atlas meets the first release coverage", () => {
	assert.ok(hardwareModules.length >= 8);
	assert.ok(failureModes.length >= 10);
	assert.ok(symptoms.length >= 12);
	assert.ok(hardwareCases.length >= 8);
});

test("black screen keeps multiple hardware causes open", () => {
	const blackScreen = symptoms.find((item) => item.id === "black-screen");
	assert.ok(blackScreen);
	assert.ok(blackScreen.relatedModuleIds.length >= 4);
	assert.ok(blackScreen.relatedFailureModeIds.includes("gpu-power-delivery"));
	assert.ok(blackScreen.relatedFailureModeIds.includes("ram-memory-instability"));
});

test("case lookups reject unknown ids without throwing", () => {
	assert.equal(getHardwareCase("case-03")?.sourceType, "Synthetic Demo");
	assert.equal(getHardwareCase("missing-case"), undefined);
});
