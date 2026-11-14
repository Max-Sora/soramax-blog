import type { BoardModel, DiagnosticSession, Measurement } from "./types";

export function createDiagnosticSession(board: BoardModel, symptom: string, measurements: Measurement[] = []): DiagnosticSession {
	const now = new Date().toISOString();
	const powerNets = board.nets.filter((net) => /V(IN|CC|DD|BAT|BUS)|3V3|5V|12V/i.test(net.name));
	const hypotheses = powerNets.length > 0 ? powerNets.slice(0, 3).map((net) => ({ title: `${net.name} input or distribution path is unverified`, confidence: 0.28, evidence: [`${net.members.length} parsed net members`, "No measurement has confirmed the rail"], nextTest: `Measure ${net.name} to GND with the board ${symptom.toLowerCase().includes("power") ? "powered off first for resistance, then powered on for voltage" : "in the stated condition"}.` })) : [{ title: "Power path is not yet mapped", confidence: 0.12, evidence: ["No trusted power rail was found in the imported data"], nextTest: "Import a KiCad schematic or record a safe, condition-labeled measurement." }];
	return { id: `session-${Date.now()}`, boardId: board.boardId, symptom, measurements, hypotheses, createdAt: now, updatedAt: now };
}

export function updateDiagnosticSession(session: DiagnosticSession, measurement: Measurement): DiagnosticSession {
	const measurements = [...session.measurements, measurement];
	const hypotheses = session.hypotheses.map((hypothesis) => ({ ...hypothesis, confidence: Math.min(0.95, hypothesis.confidence + (measurement.kind === "voltage" ? 0.08 : 0.03)), evidence: [...hypothesis.evidence, `${measurement.kind}: ${measurement.value} (${measurement.condition})`] }));
	return { ...session, measurements, hypotheses, updatedAt: new Date().toISOString() };
}
