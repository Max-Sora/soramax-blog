import type {
	CampusOpportunity,
	CareerGoal,
	CareerNavigatorData,
	JobPosting,
	Skill,
	SourceEvidence,
} from "./types";

export const SAMPLE_NOW: string = "2026-11-04T00:00:00.000Z";

export const sourceEvidence: SourceEvidence[] = [
	{
		id: "sample-career-framework",
		label: "SAMPLE planning framework (not a live job listing)",
		kind: "sample",
		retrievedAt: SAMPLE_NOW,
		note: "Used to demonstrate reverse planning. Replace with a verified posting or user-provided description before applying.",
	},
	{
		id: "uci-career",
		label: "UC Irvine Division of Career Pathways",
		kind: "official",
		url: "https://career.uci.edu/",
		retrievedAt: SAMPLE_NOW,
		appliesTo:
			"UCI students; confirm current services and dates on the source site.",
	},
	{
		id: "uci-engineering",
		label: "UCI Samueli School of Engineering",
		kind: "official",
		url: "https://engineering.uci.edu/",
		retrievedAt: SAMPLE_NOW,
		appliesTo:
			"UCI engineering students; official degree rules require catalog-year confirmation.",
	},
	{
		id: "uci-research",
		label: "UCI Office of Research undergraduate research starting point",
		kind: "official",
		url: "https://research.uci.edu/",
		retrievedAt: SAMPLE_NOW,
		appliesTo: "Research exploration; availability and deadlines change.",
	},
	{
		id: "uci-engr-research",
		label: "UCI Samueli School of Engineering research section",
		kind: "official",
		url: "https://engineering.uci.edu/research/",
		retrievedAt: SAMPLE_NOW,
		appliesTo: "Research exploration; verify faculty openings directly.",
	},
];

export const skills: Skill[] = [
	{
		id: "c-cpp",
		name: "C / C++",
		aliases: ["c", "c++", "cpp", "embedded c"],
		description: "Systems programming and resource-aware implementation.",
	},
	{
		id: "python",
		name: "Python",
		aliases: ["python", "numpy", "pandas"],
		description: "Scripting, data work, and rapid prototyping.",
	},
	{
		id: "digital-logic",
		name: "Digital logic",
		aliases: ["digital logic", "logic design", "boolean logic"],
		description: "Combinational/sequential logic and hardware reasoning.",
	},
	{
		id: "verilog",
		name: "Verilog / SystemVerilog",
		aliases: ["verilog", "systemverilog", "rtl"],
		description: "Hardware description and RTL implementation.",
	},
	{
		id: "computer-architecture",
		name: "Computer architecture",
		aliases: ["computer architecture", "cpu architecture", "microarchitecture"],
		description: "How processors, memory, and interfaces work together.",
	},
	{
		id: "microcontrollers",
		name: "Microcontrollers",
		aliases: ["microcontroller", "mcu", "stm32", "arduino", "esp32"],
		description: "Firmware and peripheral development on embedded targets.",
	},
	{
		id: "embedded-debugging",
		name: "Embedded debugging",
		aliases: [
			"embedded debugging",
			"jtag",
			"logic analyzer",
			"oscilloscope",
			"debugging",
		],
		description:
			"Finding hardware/software faults with repeatable measurements.",
	},
	{
		id: "simulation-verification",
		name: "Simulation & verification",
		aliases: ["verification", "simulation", "testbench", "uvm"],
		description:
			"Testing designs against expected behavior before integration.",
	},
	{
		id: "control-systems",
		name: "Control systems",
		aliases: ["control systems", "feedback control", "pid"],
		description: "Modeling and stabilizing dynamic systems.",
	},
	{
		id: "robotics-tools",
		name: "Robotics tools",
		aliases: ["ros", "ros2", "robot operating system", "robotics"],
		description: "Integrating sensors, planning, and actuators.",
	},
	{
		id: "sensors-instrumentation",
		name: "Sensors & instrumentation",
		aliases: ["sensors", "instrumentation", "data acquisition"],
		description: "Collecting and interpreting physical-world measurements.",
	},
	{
		id: "linux-git",
		name: "Linux / Git",
		aliases: ["linux", "git", "github", "version control"],
		description: "Reproducible development workflows and collaboration.",
	},
	{
		id: "technical-writing",
		name: "Technical writing",
		aliases: ["technical writing", "documentation", "report writing"],
		description: "Making methods, results, and decisions understandable.",
	},
	{
		id: "literature-review",
		name: "Literature review",
		aliases: ["literature review", "research papers", "paper reading"],
		description: "Finding, evaluating, and synthesizing prior work.",
	},
	{
		id: "experimental-design",
		name: "Experimental design",
		aliases: ["experimental design", "experiment design", "research methods"],
		description:
			"Designing a testable investigation with interpretable evidence.",
	},
	{
		id: "team-communication",
		name: "Team communication",
		aliases: ["teamwork", "communication", "collaboration"],
		description: "Coordinating decisions and communicating trade-offs.",
	},
];

const req = (
	id: string,
	label: string,
	skillId: string,
	importance: "mandatory" | "preferred" = "preferred",
) => ({
	id,
	label,
	skillId,
	category: "technical" as const,
	importance,
	evidenceId: "sample-career-framework",
});

export const careers: CareerGoal[] = [
	{
		id: "embedded-systems",
		title: "Embedded Systems Engineer",
		kind: "career",
		summary:
			"Build firmware and hardware-aware software that runs on constrained devices.",
		responsibilities: [
			"Write and debug firmware",
			"Integrate peripherals and sensors",
			"Measure behavior on real hardware",
		],
		skillIds: [
			"c-cpp",
			"microcontrollers",
			"embedded-debugging",
			"digital-logic",
			"linux-git",
		],
		starterActions: [
			"Make a small microcontroller project with a test log",
			"Practice debugging with one instrument and one repeatable fault",
		],
		evidenceIds: ["sample-career-framework"],
	},
	{
		id: "digital-asic",
		title: "Digital / ASIC Engineer",
		kind: "career",
		summary:
			"Design, verify, and reason about digital hardware from RTL through implementation constraints.",
		responsibilities: [
			"Write RTL",
			"Build verification plans and testbenches",
			"Reason about timing, architecture, and interfaces",
		],
		skillIds: [
			"digital-logic",
			"verilog",
			"computer-architecture",
			"simulation-verification",
			"linux-git",
		],
		starterActions: [
			"Document a small RTL block and its verification cases",
			"Compare a simulation result with an expected truth table",
		],
		evidenceIds: ["sample-career-framework"],
	},
	{
		id: "robotics",
		title: "Robotics Engineer",
		kind: "career",
		summary:
			"Combine software, sensing, control, and hardware integration to make systems act in the physical world.",
		responsibilities: [
			"Integrate sensors and actuators",
			"Prototype and tune control behavior",
			"Collaborate across software and hardware",
		],
		skillIds: [
			"c-cpp",
			"python",
			"control-systems",
			"robotics-tools",
			"sensors-instrumentation",
			"team-communication",
		],
		starterActions: [
			"Build a sensor-to-action prototype with recorded data",
			"Explain one control trade-off in a short project note",
		],
		evidenceIds: ["sample-career-framework"],
	},
	{
		id: "software-engineer",
		title: "Software Engineer",
		kind: "career",
		summary:
			"Build and maintain software while turning unclear requirements into tested, documented work.",
		responsibilities: [
			"Implement and test software",
			"Collaborate through version control",
			"Explain trade-offs in writing",
		],
		skillIds: [
			"python",
			"linux-git",
			"technical-writing",
			"team-communication",
		],
		starterActions: [
			"Ship a small tested application",
			"Write a short design note that explains one trade-off",
		],
		evidenceIds: ["sample-career-framework"],
	},
	{
		id: "undergraduate-research",
		title: "Undergraduate Research",
		kind: "research",
		summary:
			"Explore a question with a faculty or lab team, developing methods and evidence over time.",
		responsibilities: [
			"Read and discuss prior work",
			"Design or run experiments",
			"Communicate uncertainty and results",
		],
		skillIds: [
			"python",
			"literature-review",
			"experimental-design",
			"technical-writing",
			"team-communication",
		],
		starterActions: [
			"Read two papers in a topic you can explain",
			"Draft a one-page question, method, and evidence plan",
		],
		evidenceIds: [
			"sample-career-framework",
			"uci-research",
			"uci-engr-research",
		],
	},
];

export const sampleJobPostings: JobPosting[] = [
	{
		id: "sample-embedded-posting",
		title: "SAMPLE Embedded Firmware Intern",
		company: "SAMPLE Company",
		location: "Irvine, CA / Hybrid (SAMPLE)",
		postedAt: "2026-10-15",
		retrievedAt: SAMPLE_NOW,
		requirements: [
			req("embedded-c", "C or C++ for embedded systems", "c-cpp", "mandatory"),
			req(
				"embedded-mcu",
				"Microcontroller or firmware project",
				"microcontrollers",
				"mandatory",
			),
			req(
				"embedded-debug",
				"Debugging with hardware or software tools",
				"embedded-debugging",
			),
			req(
				"embedded-git",
				"Version control and collaborative workflow",
				"linux-git",
			),
		],
		sourceEvidenceId: "sample-career-framework",
		isSample: true,
	},
	{
		id: "sample-asic-posting",
		title: "SAMPLE Digital Design Intern",
		company: "SAMPLE Semiconductor",
		location: "United States (SAMPLE)",
		postedAt: "2026-10-22",
		retrievedAt: SAMPLE_NOW,
		requirements: [
			req(
				"asic-logic",
				"Digital logic fundamentals",
				"digital-logic",
				"mandatory",
			),
			req("asic-rtl", "Verilog or SystemVerilog", "verilog", "preferred"),
			req(
				"asic-verify",
				"Simulation or verification experience",
				"simulation-verification",
			),
			req(
				"asic-arch",
				"Computer architecture coursework or project",
				"computer-architecture",
			),
		],
		sourceEvidenceId: "sample-career-framework",
		isSample: true,
	},
	{
		id: "sample-software-posting",
		title: "SAMPLE Software Engineering Intern",
		company: "SAMPLE Software Company",
		location: "United States / Hybrid (SAMPLE)",
		postedAt: "2026-10-20",
		retrievedAt: SAMPLE_NOW,
		requirements: [
			req(
				"software-python",
				"Python or comparable programming experience",
				"python",
				"mandatory",
			),
			req(
				"software-git",
				"Git and collaborative development workflow",
				"linux-git",
				"mandatory",
			),
			req(
				"software-writing",
				"Clear technical communication",
				"technical-writing",
			),
		],
		sourceEvidenceId: "sample-career-framework",
		isSample: true,
	},
];

export const campusOpportunities: CampusOpportunity[] = [
	{
		id: "uci-career-resource",
		title: "UCI career advising and recruiting resources",
		description:
			"Start with official advising, workshops, and recruiting guidance. Dates and eligibility must be confirmed on the source site.",
		url: "https://career.uci.edu/",
		sourceEvidenceId: "uci-career",
		kind: "career",
	},
	{
		id: "uci-engineering-resource",
		title: "UCI Samueli School of Engineering",
		description:
			"Use the school site to verify degree and department information. This tool does not enforce graduation rules from this page.",
		url: "https://engineering.uci.edu/",
		sourceEvidenceId: "uci-engineering",
		kind: "resource",
	},
	{
		id: "uci-urop-resource",
		title: "UCI Office of Research undergraduate research starting point",
		description:
			"Use the official Office of Research site as a starting point. Faculty openings, deadlines, and requirements can change.",
		url: "https://research.uci.edu/",
		sourceEvidenceId: "uci-research",
		kind: "research",
	},
	{
		id: "uci-engr-research-resource",
		title: "UCI Samueli School research resources",
		description:
			"Browse research areas and use faculty/lab pages as the source of truth for current opportunities.",
		url: "https://engineering.uci.edu/research/",
		sourceEvidenceId: "uci-engr-research",
		kind: "research",
	},
];

export const careerNavigatorData: CareerNavigatorData = {
	skills,
	careers,
	jobPostings: sampleJobPostings,
	sources: sourceEvidence,
	campusOpportunities,
};

export const sampleRequirementByCareer: Record<string, JobPosting> = {
	"embedded-systems": sampleJobPostings[0]!,
	"digital-asic": sampleJobPostings[1]!,
	"software-engineer": sampleJobPostings[2]!,
};
