import {
	EMPTY_JOB_SNAPSHOT,
	isJobSnapshot,
} from "@/lib/career-navigator/phase2";
import { uciCampusOpportunities, uciCampusSources } from "./campus";
import jobSnapshotJson from "./jobs.json";

const parsedSnapshot: unknown = jobSnapshotJson;
export const phase2JobSnapshot = isJobSnapshot(parsedSnapshot)
	? parsedSnapshot
	: EMPTY_JOB_SNAPSHOT;
export { uciCampusOpportunities, uciCampusSources };
