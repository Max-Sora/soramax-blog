export type ParserStatus =
	| "SUPPORTED"
	| "PARTIAL"
	| "EXPERIMENTAL"
	| "UNSUPPORTED";
export type BoardSide = "top" | "bottom" | "unknown";
export type RelationKind =
	| "net-membership"
	| "functional"
	| "manual"
	| "visual"
	| "unknown";

export interface BoardCoordinate {
	x: number;
	y: number;
	unit: "mm" | "mil" | "px";
}
export interface DocumentSource {
	id: string;
	name: string;
	format: string;
	status: ParserStatus;
	sha256?: string;
	bytes?: number;
	notes: string[];
}
export interface Pad {
	id: string;
	number: string;
	x: number;
	y: number;
	width: number;
	height: number;
	shape?: string;
	side: BoardSide;
	netId?: string;
}
export interface Pin {
	number: string;
	name?: string;
	netId?: string;
	electricalType?: string;
}
export interface Component {
	ref: string;
	value?: string;
	footprint?: string;
	type?: string;
	position: BoardCoordinate;
	rotation: number;
	side: BoardSide;
	pads: Pad[];
	pins: Pin[];
	sourceConfidence: number;
	verificationStatus: "parsed" | "inferred" | "manual";
}
export interface Net {
	id: string;
	name: string;
	members: Array<{ ref: string; pinOrPad: string }>;
	relation: RelationKind;
	powerRail?: {
		nominalVoltage?: string;
		status: "confirmed" | "candidate" | "unknown";
	};
}
export interface TestPoint {
	id: string;
	label: string;
	position: BoardCoordinate;
	netId?: string;
	side: BoardSide;
}
export interface BoardModel {
	boardId: string;
	manufacturer?: string;
	model?: string;
	boardNumber?: string;
	revision?: string;
	width: number;
	height: number;
	unit: "mm" | "mil";
	sources: DocumentSource[];
	components: Component[];
	nets: Net[];
	testPoints: TestPoint[];
	layersKnown: boolean;
	layerCount?: number;
	parserWarnings: string[];
}
export interface PhotoAlignment {
	mode: "manual" | "automatic";
	transform: [
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
	];
	anchors: Array<{
		id: string;
		photoX: number;
		photoY: number;
		boardX: number;
		boardY: number;
	}>;
	reprojectionError?: number;
	confidence: number;
}
export interface Measurement {
	id: string;
	ref?: string;
	netId?: string;
	kind: "voltage" | "resistance" | "continuity" | "diode" | "scope";
	value: string;
	condition: "powered" | "unpowered" | "unknown";
	ground?: string;
	takenAt: string;
	note?: string;
	verified: boolean;
}
export interface DiagnosticSession {
	id: string;
	boardId: string;
	symptom: string;
	measurements: Measurement[];
	hypotheses: Array<{
		title: string;
		confidence: number;
		evidence: string[];
		nextTest: string;
	}>;
	createdAt: string;
	updatedAt: string;
}
