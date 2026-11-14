import { test } from "node:test";
import assert from "node:assert/strict";
import { detectFormat, parseKiCadPcb } from "./parser";

const pcb = `(kicad_pcb (version 20240108) (generator pcbnew)
(general (thickness 1.6)) (layers (0 "F.Cu" signal))
(net 0 "") (net 1 "GND") (net 2 "+3V3")
(footprint "Package_SO:SOIC-8" (layer "F.Cu") (at 10 20)
(property "Reference" "U17") (property "Value" "TEST")
(pad "1" smd rect (at 0 0) (size 1 1) (layers "F.Cu") (net 2 "+3V3"))))`;

test("detects content before trusting extension", () => {
	assert.equal(detectFormat("fixture.kicad_pcb", pcb).status, "SUPPORTED");
	assert.equal(detectFormat("fixture.brd", "not a board").status, "UNSUPPORTED");
});

test("parses component, pad and net membership", () => {
	const board = parseKiCadPcb("fixture.kicad_pcb", pcb);
	assert.equal(board.components[0]?.ref, "U17");
	assert.equal(board.components[0]?.pads[0]?.netId, "2");
	assert.equal(board.nets.find((net) => net.id === "2")?.members[0]?.pinOrPad, "1");
});
