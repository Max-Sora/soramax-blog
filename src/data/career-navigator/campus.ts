import type {
	CampusOpportunity,
	SourceEvidence,
} from "@/lib/career-navigator/types";

export const UCI_CAMPUS_CHECKED_AT = "2026-11-04T00:00:00.000Z";

export const uciCampusSources: SourceEvidence[] = [
	{
		id: "uci-career-fairs",
		label: "UCI Division of Career Pathways career fairs",
		kind: "official",
		url: "https://career.uci.edu/career-fairs/",
		retrievedAt: UCI_CAMPUS_CHECKED_AT,
		note: "Official starting point; current dates, registration, and eligibility must be confirmed on the source page.",
	},
	{
		id: "uci-career-events",
		label: "UCI Division of Career Pathways events",
		kind: "official",
		url: "https://career.uci.edu/about/events/",
		retrievedAt: UCI_CAMPUS_CHECKED_AT,
		note: "Official starting point; event dates are not copied into this static snapshot.",
	},
	{
		id: "uci-engineering-advising",
		label: "UCI Engineering undergraduate advising and course planning",
		kind: "official",
		url: "https://undergraduate.eng.uci.edu/advising/course-planning/",
		retrievedAt: UCI_CAMPUS_CHECKED_AT,
		note: "Use the current catalog and advisor guidance for official degree decisions.",
	},
	{
		id: "uci-catalogue",
		label: "UCI Catalogue",
		kind: "official",
		url: "https://catalogue.uci.edu/",
		retrievedAt: UCI_CAMPUS_CHECKED_AT,
		note: "Catalog year and prerequisites must be checked against the student’s applicable catalog.",
	},
	{
		id: "uci-urop",
		label: "UCI Undergraduate Research Opportunities Program",
		kind: "official",
		url: "https://urop.uci.edu/",
		retrievedAt: UCI_CAMPUS_CHECKED_AT,
		note: "Official research starting point; openings and deadlines are not asserted here.",
	},
];

export const uciCampusOpportunities: CampusOpportunity[] = [
	{
		id: "uci-career-fairs-resource",
		title: "Review upcoming UCI career fairs",
		description:
			"Use the official page to confirm dates, participating employers, registration, and eligibility. Date: UNKNOWN in this static snapshot.",
		url: "https://career.uci.edu/career-fairs/",
		sourceEvidenceId: "uci-career-fairs",
		kind: "event",
		dateStatus: "unknown",
		lastCheckedAt: UCI_CAMPUS_CHECKED_AT,
		registrationUrl: "https://career.uci.edu/career-fairs/",
		relevantInterests: [
			"embedded systems",
			"robotics",
			"hardware",
			"digital design",
		],
	},
	{
		id: "uci-career-events-resource",
		title: "Check UCI career workshops and employer events",
		description:
			"The official events page is the source of truth for dates and registration. No event is treated as current without a confirmed date.",
		url: "https://career.uci.edu/about/events/",
		sourceEvidenceId: "uci-career-events",
		kind: "career",
		dateStatus: "unknown",
		lastCheckedAt: UCI_CAMPUS_CHECKED_AT,
		registrationUrl: "https://career.uci.edu/about/events/",
	},
	{
		id: "uci-course-planning-resource",
		title: "Confirm course planning with UCI Engineering advising",
		description:
			"Use this official planning resource before relying on a course or prerequisite recommendation. The navigator does not copy a counselor-approved schedule.",
		url: "https://undergraduate.eng.uci.edu/advising/course-planning/",
		sourceEvidenceId: "uci-engineering-advising",
		kind: "resource",
		dateStatus: "unknown",
		lastCheckedAt: UCI_CAMPUS_CHECKED_AT,
		relevantInterests: [
			"academic planning",
			"electrical engineering",
			"computer engineering",
		],
	},
	{
		id: "uci-catalogue-resource",
		title: "Verify catalog-year requirements and prerequisites",
		description:
			"Use the UCI Catalogue for the applicable catalog year. This resource is informational and does not enforce graduation requirements in the MVP.",
		url: "https://catalogue.uci.edu/",
		sourceEvidenceId: "uci-catalogue",
		kind: "resource",
		dateStatus: "unknown",
		lastCheckedAt: UCI_CAMPUS_CHECKED_AT,
	},
	{
		id: "uci-urop-resource",
		title: "Explore UCI undergraduate research",
		description:
			"Use UROP as an official starting point; verify current faculty opportunities, application windows, and eligibility directly.",
		url: "https://urop.uci.edu/",
		sourceEvidenceId: "uci-urop",
		kind: "research",
		dateStatus: "unknown",
		lastCheckedAt: UCI_CAMPUS_CHECKED_AT,
		relevantInterests: [
			"undergraduate research",
			"embedded systems",
			"robotics",
			"computer vision",
		],
	},
];
