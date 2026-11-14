import type { BoardModel, Component, DocumentSource, Net, Pad, ParserStatus } from "./types";

const sourceId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "source";
const num = (value: string | undefined, fallback = 0) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };
const quoted = (line: string, key: string) => line.match(new RegExp("\\(" + key + "\\s+\"([^\"]*)\""))?.[1];

export function detectFormat(name: string, content: string): { format: string; status: ParserStatus } {
	const lower = name.toLowerCase();
	if (lower.endsWith(".kicad_pcb") || /\(kicad_pcb\s/.test(content)) return { format: "KiCad PCB", status: "SUPPORTED" };
	if (lower.endsWith(".kicad_sch") || /\(kicad_sch\s/.test(content)) return { format: "KiCad Schematic", status: "PARTIAL" };
	if (/^BRD\s|^BRD\|/m.test(content)) return { format: "BoardView BRD", status: "EXPERIMENTAL" };
	if (/^.{0,20}(GenCAD|BOARD\s+HEADER)/im.test(content)) return { format: "GenCAD", status: "EXPERIMENTAL" };
	if (/^%INC/i.test(content) || /PUN.*NET/i.test(content)) return { format: "IPC-D-356", status: "EXPERIMENTAL" };
	if (/^%PDF-/.test(content)) return { format: "PDF", status: "PARTIAL" };
	return { format: "Unknown", status: "UNSUPPORTED" };
}

function parseLayer(value?: string): "top" | "bottom" | "unknown" { return value === "F.Cu" || value === "F.SilkS" ? "top" : value === "B.Cu" || value === "B.SilkS" ? "bottom" : "unknown"; }

export function parseKiCadPcb(name: string, content: string): BoardModel {
	const detection = detectFormat(name, content);
	if (detection.format !== "KiCad PCB") throw new Error("Unsupported board content for " + name);
	const size = content.match(/\(board_size\s+([0-9.]+)\s+([0-9.]+)/);
	const netMap = new Map<string, Net>();
	for (const match of content.matchAll(/\(net\s+(\d+)\s+"([^"]*)"\)/g)) if (!netMap.has(match[1]!)) netMap.set(match[1]!, { id: match[1]!, name: match[2]!, members: [], relation: "net-membership" });
	const nets = Array.from(netMap.values());
	const components: Component[] = [];
	const footprintBlocks: RegExpMatchArray[] = [];
	for (const start of content.matchAll(/\(footprint\s+"([^"]*)"/g)) {
		let depth = 0; let end = start.index ?? 0;
		for (; end < content.length; end += 1) { const char = content[end]; if (char === "(") depth += 1; else if (char === ")") { depth -= 1; if (depth === 0) { end += 1; break; } } }
		const block = content.slice(start.index ?? 0, end).match(/\(footprint\s+"([^"]*)"([\s\S]*)/); if (block) footprintBlocks.push(block as RegExpMatchArray);
	}
	for (const block of footprintBlocks) {
		const footprint = block[1] ?? ""; const body = block[2] ?? "";
		const ref = quoted(body, "property\\s+\"Reference\"") ?? quoted(body, "reference");
		if (!ref || ref.startsWith("#")) continue;
		const value = quoted(body, "property\\s+\"Value\"") ?? quoted(body, "value");
		const at = body.match(/\(at\s+([-0-9.]+)\s+([-0-9.]+)(?:\s+([-0-9.]+))?/);
		const layer = body.match(/\(layer\s+"([^"]+)"\)/)?.[1];
		const pads: Pad[] = [];
		for (const pad of body.matchAll(/\(pad\s+"?([^"\s]+)"?\s+([^\s]+)\s+([^\s]+)\s+\(at\s+([-0-9.]+)\s+([-0-9.]+)[^)]*\)\s+\(size\s+([-0-9.]+)\s+([-0-9.]+)[^)]*\)([\s\S]*?)(?=\s*\(pad\s|\s*\)\s*$)/g)) {
			const padBody = pad[8] ?? ""; const net = padBody.match(/\(net\s+(\d+)\s+"([^"]*)"\)/); const netId = net?.[1];
			pads.push({ id: ref + "-" + pad[1], number: pad[1]!, x: num(pad[4]), y: num(pad[5]), width: num(pad[6]), height: num(pad[7]), shape: pad[2], side: parseLayer(layer), netId });
			if (netId) nets.find((item) => item.id === netId)?.members.push({ ref, pinOrPad: pad[1]! });
		}
		components.push({ ref, value, footprint, position: { x: num(at?.[1]), y: num(at?.[2]), unit: "mm" }, rotation: num(at?.[3]), side: parseLayer(layer), pads, pins: pads.map((pad) => ({ number: pad.number, netId: pad.netId })), sourceConfidence: 0.98, verificationStatus: "parsed" });
	}
	for (const net of nets) for (const member of net.members) { const component = components.find((item) => item.ref === member.ref); const pin = component?.pins.find((item) => item.number === member.pinOrPad); if (pin) pin.netId = net.id; }
	const warnings = components.length ? [] : ["No footprints were found; verify that this is a complete KiCad PCB file."];
	return { boardId: sourceId(name), width: num(size?.[1], 100), height: num(size?.[2], 80), unit: "mm", sources: [{ id: sourceId(name), name, format: detection.format, status: detection.status, notes: ["Parsed locally in the browser; no file was uploaded."] }], components, nets, testPoints: components.filter((item) => /^TP/i.test(item.ref)).map((item) => ({ id: item.ref, label: item.ref, position: item.position, side: item.side, netId: item.pads[0]?.netId })), layersKnown: /\(layers\s/.test(content), layerCount: undefined, parserWarnings: warnings };
}

export function parseSchematicSummary(name: string, content: string): DocumentSource {
	const detection = detectFormat(name, content);
	return { id: sourceId(name), name, format: detection.format, status: detection.status, bytes: content.length, notes: detection.status === "PARTIAL" ? ["Reference and page text can be indexed; connectivity still requires a trusted schematic parser."] : ["File detected; no electrical connectivity asserted."] };
}

export function parseBoardFile(name: string, content: string): BoardModel | DocumentSource {
	const detection = detectFormat(name, content);
	if (detection.format === "KiCad PCB") return parseKiCadPcb(name, content);
	return parseSchematicSummary(name, content);
}




