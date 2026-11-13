import type {
	CareerGoal,
	MatchAnalysis,
	RoadmapAction,
	StudentProfile,
} from "./types";

/** Provider-independent seam for a future server-side model adapter. */
export interface CareerAnalysisRequest {
	profile: StudentProfile;
	career: CareerGoal;
	jobText?: string;
	consentToSendPrivateData: boolean;
}

export interface CareerAnalysisResult {
	mode: "deterministic" | "ai";
	roadmap: RoadmapAction[];
	match?: MatchAnalysis;
	notes: string[];
}

export interface CareerAnalysisProvider {
	analyze(request: CareerAnalysisRequest): Promise<CareerAnalysisResult>;
}

/** Default release behavior: no network request and no model claim. */
export class DeterministicCareerAnalysisProvider
	implements CareerAnalysisProvider
{
	async analyze(request: CareerAnalysisRequest): Promise<CareerAnalysisResult> {
		return {
			mode: "deterministic",
			roadmap: [],
			notes: [
				"No AI provider is configured. This result is generated locally from labeled planning fixtures and user-entered text.",
				request.consentToSendPrivateData
					? "Consent was recorded for a future provider, but no data was sent in this build."
					: "Private data stays in this browser unless the user explicitly enables a future provider.",
			],
		};
	}
}
