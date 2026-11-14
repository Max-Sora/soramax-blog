import assert from "node:assert/strict";
import { test } from "node:test";
import { parseKiCadPcb } from "./parser";
import { findNetMembers, findPinNet } from "./queries";

test("cross-probes pin to net and members", () => {
	const board = parseKiCadPcb(
		"fixture.kicad_pcb",
		`(kicad_pcb (version 20240108) (generator pcbnew) (general (thickness 1.6)) (layers (0 "F.Cu" signal)) (net 0 "") (net 1 "GND") (net 2 "+3V3") (footprint "x" (layer "F.Cu") (at 10 20) (property "Reference" "U17") (property "Value" "TEST") (pad "1" smd rect (at 0 0) (size 1 1) (layers "F.Cu") (net 2 "+3V3"))))`,
	);
	assert.equal(findPinNet(board, "U17", "1")?.name, "+3V3");
	assert.deepEqual(findNetMembers(board, "+3V3"), [
		{ ref: "U17", pinOrPad: "1" },
	]);
});
