import jobSnapshotJson from "./jobs.json";
import { uciCampusOpportunities, uciCampusSources } from "./campus";
import { EMPTY_JOB_SNAPSHOT, isJobSnapshot } from "@/lib/career-navigator/phase2";

const parsedSnapshot: unknown = jobSnapshotJson;
export const phase2JobSnapshot = isJobSnapshot(parsedSnapshot) ? parsedSnapshot : EMPTY_JOB_SNAPSHOT;
export { uciCampusOpportunities, uciCampusSources };
