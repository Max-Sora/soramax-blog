import type { CareerAnalysisRequest, CareerAnalysisResult } from "./ai";

export interface WorkerAiClientOptions {
	baseUrl: string;
	consentToSendPrivateData: boolean;
	signal?: AbortSignal;
}

export interface WorkerAiError {
	code: string;
	message: string;
	status?: number;
}

export async function analyzeWithWorker(
	request: CareerAnalysisRequest,
	options: WorkerAiClientOptions,
): Promise<CareerAnalysisResult | WorkerAiError> {
	if (!options.baseUrl)
		return {
			code: "unconfigured",
			message: "No Career Navigator AI Worker URL is configured.",
		};
	if (!options.consentToSendPrivateData)
		return {
			code: "consent_required",
			message:
				"Explicit consent is required before sending private profile data.",
		};
	try {
		const response = await fetch(
			`${options.baseUrl.replace(/\/$/, "")}/v1/analyze`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...request, consentToSendPrivateData: true }),
				signal: options.signal,
			},
		);
		const payload: unknown = await response.json();
		if (!response.ok || !payload || typeof payload !== "object")
			return {
				code: "provider_unavailable",
				message: "The AI Worker did not return a usable analysis.",
				status: response.status,
			};
		const result = payload as Partial<CareerAnalysisResult>;
		if (
			result.mode !== "ai" ||
			!Array.isArray(result.roadmap) ||
			!Array.isArray(result.notes)
		)
			return {
				code: "invalid_output",
				message: "The AI Worker response failed the client output contract.",
				status: response.status,
			};
		return result as CareerAnalysisResult;
	} catch {
		return {
			code: "network_error",
			message: "The AI Worker could not be reached.",
		};
	}
}
