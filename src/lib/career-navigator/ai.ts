import { analyzePosting, generateRoadmap } from "./engine";
import { skills } from "./fixtures";
import type {
	CareerGoal,
	JobPosting,
	MatchAnalysis,
	RoadmapAction,
	RoadmapOptions,
	StudentProfile,
} from "./types";

/** Provider-independent seam for future server-side model adapters. */
export interface CareerAnalysisRequest {
	profile: StudentProfile;
	career: CareerGoal;
	jobText?: string;
	posting?: JobPosting;
	workload?: RoadmapOptions;
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

/** Default release behavior: local deterministic evidence analysis, no network request and no model claim. */
export class DeterministicCareerAnalysisProvider
	implements CareerAnalysisProvider
{
	async analyze(request: CareerAnalysisRequest): Promise<CareerAnalysisResult> {
		const match = request.posting
			? analyzePosting(request.profile, request.posting, skills)
			: undefined;
		const roadmap = generateRoadmap(
			request.profile,
			request.career,
			skills,
			request.workload,
			request.posting,
		);
		return {
			mode: "deterministic",
			roadmap,
			match,
			notes: [
				"Deterministic analysis is active. No external model was called.",
				request.posting
					? "Requirement evidence comes from the current user-provided or normalized public posting; unknown requirements remain visible for review."
					: "No posting was supplied, so the roadmap uses the selected career framework only.",
				request.consentToSendPrivateData
					? "Consent was recorded for a future provider, but no private data was sent in this build."
					: "Private data stays in this browser unless a future provider is explicitly enabled.",
			],
		};
	}
}
