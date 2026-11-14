export type HardwareModuleId =
	| "motherboard"
	| "cpu"
	| "gpu"
	| "ram"
	| "storage"
	| "psu"
	| "cooling"
	| "fans"
	| "display";

export type FailureModeId =
	| "gpu-thermal-throttling"
	| "gpu-power-delivery"
	| "gpu-driver-failure"
	| "psu-power-instability"
	| "ram-memory-instability"
	| "cpu-thermal-throttling"
	| "storage-health-degradation"
	| "display-signal-path"
	| "motherboard-post-failure"
	| "fan-bearing-noise";

export type SymptomId =
	| "black-screen"
	| "no-display-signal"
	| "low-fps"
	| "stuttering"
	| "random-reboot"
	| "bsod"
	| "overheating"
	| "boot-failure"
	| "disk-slowness"
	| "application-crash"
	| "display-artifacts"
	| "excessive-fan-noise";

export type HardwareSourceType =
	| "Synthetic Demo"
	| "Public Reference"
	| "Verified Local Case";
export type VerificationStatus = "synthetic" | "reference" | "verified";
export type FaultSeverity = "watch" | "warning" | "critical";

export interface VisualPosition {
	x: number;
	y: number;
	w: number;
	h: number;
	shape: "rect" | "round" | "bar" | "port";
}

export interface HardwareModule {
	id: HardwareModuleId;
	name: string;
	nameZh: string;
	category: string;
	simpleDescription: string;
	engineeringRole: string;
	failureModeIds: FailureModeId[];
	symptomIds: SymptomId[];
	relatedCaseIds: string[];
	connectedModuleIds: HardwareModuleId[];
	visualPosition: VisualPosition;
	accent: "cyan" | "teal" | "amber" | "violet" | "red";
}

export interface FailureMode {
	id: FailureModeId;
	title: string;
	description: string;
	affectedModuleIds: HardwareModuleId[];
	symptomIds: SymptomId[];
	diagnosticIndicators: string[];
	quickChecks: string[];
	severity: FaultSeverity;
}

export interface Symptom {
	id: SymptomId;
	title: string;
	description: string;
	relatedModuleIds: HardwareModuleId[];
	relatedFailureModeIds: FailureModeId[];
	relatedCaseIds: string[];
}

export interface EvidenceItem {
	id: string;
	label: string;
	value: string;
	source: string;
}

export interface HardwareCase {
	id: string;
	title: string;
	summary: string;
	moduleIds: HardwareModuleId[];
	symptomIds: SymptomId[];
	failureModeIds: FailureModeId[];
	evidenceIds: string[];
	evidence: EvidenceItem[];
	sourceType: HardwareSourceType;
	confidence: number;
	verificationStatus: VerificationStatus;
}

export const hardwareModules: HardwareModule[] = [
	{
		id: "motherboard",
		name: "Motherboard",
		nameZh: "主板",
		category: "Platform / interconnect",
		simpleDescription:
			"The board that routes power, memory, storage and expansion signals between every major module.",
		engineeringRole:
			"Hosts the chipset, firmware, VRM and physical buses. PCIe, DDR and storage links define the system's electrical topology.",
		failureModeIds: ["motherboard-post-failure", "psu-power-instability"],
		symptomIds: [
			"black-screen",
			"no-display-signal",
			"random-reboot",
			"boot-failure",
			"bsod",
			"application-crash",
		],
		relatedCaseIds: ["case-01", "case-04", "case-06"],
		connectedModuleIds: ["cpu", "gpu", "ram", "storage", "psu", "display"],
		visualPosition: { x: 100, y: 92, w: 360, h: 318, shape: "rect" },
		accent: "teal",
	},
	{
		id: "cpu",
		name: "CPU",
		nameZh: "处理器",
		category: "Compute",
		simpleDescription:
			"Runs instructions and coordinates the operating system, applications and peripherals.",
		engineeringRole:
			"Executes general-purpose workloads across cores and threads, with cache and memory-controller latency shaping system responsiveness.",
		failureModeIds: ["cpu-thermal-throttling", "motherboard-post-failure"],
		symptomIds: [
			"overheating",
			"stuttering",
			"random-reboot",
			"boot-failure",
			"application-crash",
		],
		relatedCaseIds: ["case-05", "case-07"],
		connectedModuleIds: ["motherboard", "ram", "cooling"],
		visualPosition: { x: 148, y: 148, w: 98, h: 82, shape: "round" },
		accent: "violet",
	},
	{
		id: "gpu",
		name: "GPU",
		nameZh: "显卡",
		category: "Parallel compute",
		simpleDescription:
			"Renders games, video and 3D scenes while accelerating highly parallel workloads.",
		engineeringRole:
			"Executes graphics and compute kernels in parallel and moves high-bandwidth working sets through dedicated VRAM and PCIe.",
		failureModeIds: [
			"gpu-thermal-throttling",
			"gpu-power-delivery",
			"gpu-driver-failure",
		],
		symptomIds: [
			"black-screen",
			"no-display-signal",
			"low-fps",
			"stuttering",
			"application-crash",
			"display-artifacts",
			"random-reboot",
		],
		relatedCaseIds: ["case-01", "case-02", "case-03", "case-08"],
		connectedModuleIds: ["motherboard", "psu", "cooling", "display"],
		visualPosition: { x: 132, y: 278, w: 276, h: 62, shape: "bar" },
		accent: "cyan",
	},
	{
		id: "ram",
		name: "RAM",
		nameZh: "内存",
		category: "Volatile memory",
		simpleDescription:
			"Provides fast temporary workspace for the CPU and active applications.",
		engineeringRole:
			"DDR channels move cache lines and process state between the integrated memory controller and DIMMs; timing and signal margin matter.",
		failureModeIds: ["ram-memory-instability", "motherboard-post-failure"],
		symptomIds: [
			"black-screen",
			"bsod",
			"application-crash",
			"boot-failure",
			"stuttering",
		],
		relatedCaseIds: ["case-04", "case-06"],
		connectedModuleIds: ["motherboard", "cpu"],
		visualPosition: { x: 282, y: 136, w: 26, h: 112, shape: "bar" },
		accent: "amber",
	},
	{
		id: "storage",
		name: "NVMe SSD",
		nameZh: "固态硬盘",
		category: "Persistent storage",
		simpleDescription:
			"Stores the operating system, applications and files between power cycles.",
		engineeringRole:
			"Maps logical blocks through flash translation layers; queue depth, NAND health and controller thermals influence latency.",
		failureModeIds: ["storage-health-degradation"],
		symptomIds: ["disk-slowness", "boot-failure", "application-crash"],
		relatedCaseIds: ["case-05"],
		connectedModuleIds: ["motherboard", "cpu"],
		visualPosition: { x: 314, y: 252, w: 102, h: 22, shape: "bar" },
		accent: "teal",
	},
	{
		id: "psu",
		name: "Power Supply",
		nameZh: "电源",
		category: "Power delivery",
		simpleDescription:
			"Converts wall power into stable rails for the board, CPU, GPU and drives.",
		engineeringRole:
			"Regulates AC input into DC rails and responds to transient load changes; protection circuits can shut down on an out-of-range condition.",
		failureModeIds: ["psu-power-instability", "gpu-power-delivery"],
		symptomIds: [
			"black-screen",
			"random-reboot",
			"no-display-signal",
			"boot-failure",
		],
		relatedCaseIds: ["case-02", "case-07"],
		connectedModuleIds: ["motherboard", "gpu", "cooling"],
		visualPosition: { x: 490, y: 332, w: 180, h: 102, shape: "rect" },
		accent: "amber",
	},
	{
		id: "cooling",
		name: "CPU Cooler",
		nameZh: "散热器",
		category: "Thermal path",
		simpleDescription:
			"Moves heat away from the CPU into the case airflow path.",
		engineeringRole:
			"A thermal interface, heatsink and fan establish resistance from die to ambient; control firmware adjusts speed against temperature targets.",
		failureModeIds: ["cpu-thermal-throttling", "fan-bearing-noise"],
		symptomIds: [
			"overheating",
			"stuttering",
			"random-reboot",
			"excessive-fan-noise",
		],
		relatedCaseIds: ["case-07"],
		connectedModuleIds: ["cpu", "fans"],
		visualPosition: { x: 132, y: 116, w: 130, h: 26, shape: "bar" },
		accent: "violet",
	},
	{
		id: "fans",
		name: "Case Fans",
		nameZh: "机箱风扇",
		category: "Airflow",
		simpleDescription:
			"Exchanges warm internal air for cooler room air and keeps hotspots from recirculating.",
		engineeringRole:
			"Fan curves and pressure balance determine volumetric flow through filters, heatsinks and the GPU exhaust path.",
		failureModeIds: ["fan-bearing-noise", "cpu-thermal-throttling"],
		symptomIds: ["overheating", "excessive-fan-noise", "stuttering"],
		relatedCaseIds: ["case-07"],
		connectedModuleIds: ["cooling", "gpu", "psu"],
		visualPosition: { x: 528, y: 102, w: 86, h: 86, shape: "round" },
		accent: "teal",
	},
	{
		id: "display",
		name: "Display Output",
		nameZh: "显示输出",
		category: "Signal path",
		simpleDescription:
			"Carries the rendered frame from the GPU to a monitor through a physical output path.",
		engineeringRole:
			"The GPU output engine serializes pixels over HDMI or DisplayPort; link training, cable integrity and input selection determine lock.",
		failureModeIds: ["display-signal-path", "gpu-driver-failure"],
		symptomIds: [
			"black-screen",
			"no-display-signal",
			"display-artifacts",
			"low-fps",
		],
		relatedCaseIds: ["case-01", "case-03", "case-08"],
		connectedModuleIds: ["gpu", "motherboard"],
		visualPosition: { x: 650, y: 240, w: 60, h: 42, shape: "port" },
		accent: "cyan",
	},
];

export const failureModes: FailureMode[] = [
	{
		id: "gpu-thermal-throttling",
		title: "Thermal throttling",
		description:
			"The GPU protects itself by reducing clock or voltage when the thermal envelope is exceeded.",
		affectedModuleIds: ["gpu", "cooling", "fans"],
		symptomIds: ["low-fps", "stuttering", "overheating"],
		diagnosticIndicators: [
			"Temperature rises toward the configured limit",
			"Clock speed drops during sustained load",
			"Performance recovers after cooling",
		],
		quickChecks: [
			"Compare idle and load temperature with a trusted monitor",
			"Check intake and exhaust paths for dust",
			"Stop if there is an electrical smell or visible damage",
		],
		severity: "warning",
	},
	{
		id: "gpu-power-delivery",
		title: "GPU power delivery",
		description:
			"A loose connector, overloaded rail or transient response issue can interrupt GPU operation under load.",
		affectedModuleIds: ["gpu", "psu", "motherboard"],
		symptomIds: ["black-screen", "random-reboot", "application-crash"],
		diagnosticIndicators: [
			"Failure repeats when GPU load rises",
			"Power connectors are not fully seated",
			"Event logs show a display-driver reset or bus error",
		],
		quickChecks: [
			"Power down before inspecting external connections",
			"Use the PSU manufacturer's cable set only",
			"Do not open a PSU enclosure",
		],
		severity: "critical",
	},
	{
		id: "gpu-driver-failure",
		title: "Driver or link failure",
		description:
			"A software crash or unstable display link can stop frames from reaching the output device.",
		affectedModuleIds: ["gpu", "display", "motherboard"],
		symptomIds: ["no-display-signal", "display-artifacts", "application-crash"],
		diagnosticIndicators: [
			"Issue begins after a driver or display change",
			"A second output or known-good cable behaves differently",
			"The OS may still be responsive",
		],
		quickChecks: [
			"Try a known-good input and cable",
			"Record driver version before changing it",
			"Keep the monitor and PC powered down for cable changes",
		],
		severity: "watch",
	},
	{
		id: "psu-power-instability",
		title: "Power delivery instability",
		description:
			"Protection trips or rail instability can reset the system when the load changes quickly.",
		affectedModuleIds: ["psu", "motherboard", "gpu"],
		symptomIds: ["random-reboot", "black-screen", "boot-failure"],
		diagnosticIndicators: [
			"Failure correlates with load transitions",
			"System resets without an application-level error",
			"Power event appears in firmware or OS logs",
		],
		quickChecks: [
			"Test the wall connection and surge protector",
			"Remove nonessential USB load",
			"Never probe or open a PSU while powered",
		],
		severity: "critical",
	},
	{
		id: "ram-memory-instability",
		title: "Memory instability",
		description:
			"Marginal DIMM contact, timing or a failing module can corrupt process state and boot training.",
		affectedModuleIds: ["ram", "cpu", "motherboard"],
		symptomIds: ["bsod", "application-crash", "boot-failure", "black-screen"],
		diagnosticIndicators: [
			"Errors follow a repeatable memory test pattern",
			"One DIMM or slot changes the result",
			"Failure is not tied to a single application",
		],
		quickChecks: [
			"Return memory settings to a known-safe profile",
			"Run a bootable memory test",
			"Power down fully before reseating a module",
		],
		severity: "warning",
	},
	{
		id: "cpu-thermal-throttling",
		title: "CPU thermal throttling",
		description:
			"The CPU reduces frequency to remain within its thermal control target.",
		affectedModuleIds: ["cpu", "cooling", "fans"],
		symptomIds: ["overheating", "stuttering", "random-reboot"],
		diagnosticIndicators: [
			"Temperature climbs while clocks fall",
			"Fan speed reaches its curve ceiling",
			"Load performance improves after a cool-down",
		],
		quickChecks: [
			"Verify cooler fan or pump is detected",
			"Check that vents are clear",
			"Stop if the heatsink is loose or the system smells burnt",
		],
		severity: "warning",
	},
	{
		id: "storage-health-degradation",
		title: "Storage health degradation",
		description:
			"Flash wear, controller errors or a full drive can increase latency and threaten boot integrity.",
		affectedModuleIds: ["storage", "motherboard"],
		symptomIds: ["disk-slowness", "boot-failure", "application-crash"],
		diagnosticIndicators: [
			"SMART or vendor health counters change",
			"Latency spikes during ordinary reads",
			"The issue follows a specific drive",
		],
		quickChecks: [
			"Back up important files before testing",
			"Review health data with the drive vendor tool",
			"Do not repeatedly power-cycle a clicking or failing drive",
		],
		severity: "warning",
	},
	{
		id: "display-signal-path",
		title: "Display signal path",
		description:
			"The rendered signal may fail to train because of the cable, monitor input, adapter or output port.",
		affectedModuleIds: ["display", "gpu", "motherboard"],
		symptomIds: ["no-display-signal", "black-screen", "display-artifacts"],
		diagnosticIndicators: [
			"Monitor reports no signal while the PC remains on",
			"A different port or cable changes the result",
			"Artifacts appear only on one link",
		],
		quickChecks: [
			"Select the correct monitor input",
			"Try a known-good cable without an adapter",
			"Change cables only while both devices are off",
		],
		severity: "watch",
	},
	{
		id: "motherboard-post-failure",
		title: "POST or firmware failure",
		description:
			"The platform may fail before the operating system loads when firmware training or board power sequencing does not complete.",
		affectedModuleIds: ["motherboard", "cpu", "ram"],
		symptomIds: ["boot-failure", "black-screen", "no-display-signal"],
		diagnosticIndicators: [
			"POST code, status LED or beep pattern repeats",
			"The OS never begins loading",
			"Clearing a safe configuration changes the result",
		],
		quickChecks: [
			"Record the board's documented diagnostic code",
			"Disconnect nonessential peripherals",
			"Use the board manual; avoid random firmware flashing",
		],
		severity: "critical",
	},
	{
		id: "fan-bearing-noise",
		title: "Fan bearing or airflow noise",
		description:
			"A worn bearing, obstruction or aggressive fan curve can create noise and reduce cooling headroom.",
		affectedModuleIds: ["fans", "cooling", "psu"],
		symptomIds: ["excessive-fan-noise", "overheating", "stuttering"],
		diagnosticIndicators: [
			"Noise changes with a specific fan curve",
			"A fan reports an unstable RPM",
			"Dust or a cable contacts the blade",
		],
		quickChecks: [
			"Identify the noisy fan without touching moving blades",
			"Clean only with power removed",
			"Do not open a PSU to access its fan",
		],
		severity: "watch",
	},
];

export const symptoms: Symptom[] = [
	{
		id: "black-screen",
		title: "Black Screen",
		description:
			"The system powers on but the display remains blank; multiple modules can produce this symptom.",
		relatedModuleIds: ["gpu", "ram", "psu", "motherboard", "display"],
		relatedFailureModeIds: [
			"gpu-power-delivery",
			"ram-memory-instability",
			"psu-power-instability",
			"display-signal-path",
			"motherboard-post-failure",
		],
		relatedCaseIds: ["case-01", "case-02", "case-04", "case-06"],
	},
	{
		id: "no-display-signal",
		title: "No Display Signal",
		description: "The monitor cannot lock to a valid input signal from the PC.",
		relatedModuleIds: ["display", "gpu", "motherboard", "psu"],
		relatedFailureModeIds: [
			"display-signal-path",
			"gpu-driver-failure",
			"psu-power-instability",
			"motherboard-post-failure",
		],
		relatedCaseIds: ["case-01", "case-02", "case-03"],
	},
	{
		id: "low-fps",
		title: "Low FPS",
		description:
			"Rendered frame rate is lower than expected for the workload and settings.",
		relatedModuleIds: ["gpu", "cpu", "cooling", "display"],
		relatedFailureModeIds: ["gpu-thermal-throttling", "gpu-driver-failure"],
		relatedCaseIds: ["case-03", "case-08"],
	},
	{
		id: "stuttering",
		title: "Stuttering",
		description:
			"Frame delivery or application response arrives with visible or audible pauses.",
		relatedModuleIds: ["gpu", "cpu", "ram", "cooling", "fans"],
		relatedFailureModeIds: [
			"gpu-thermal-throttling",
			"cpu-thermal-throttling",
			"ram-memory-instability",
		],
		relatedCaseIds: ["case-03", "case-04", "case-07"],
	},
	{
		id: "random-reboot",
		title: "Random Reboot",
		description:
			"The machine restarts without a deliberate user action, often during a state transition or load change.",
		relatedModuleIds: ["psu", "motherboard", "gpu", "cpu", "cooling"],
		relatedFailureModeIds: [
			"psu-power-instability",
			"gpu-power-delivery",
			"cpu-thermal-throttling",
		],
		relatedCaseIds: ["case-02", "case-07"],
	},
	{
		id: "bsod",
		title: "BSOD",
		description:
			"The operating system stops with a bugcheck after detecting corrupted or unsafe execution state.",
		relatedModuleIds: ["ram", "cpu", "motherboard", "storage"],
		relatedFailureModeIds: [
			"ram-memory-instability",
			"storage-health-degradation",
		],
		relatedCaseIds: ["case-04", "case-05"],
	},
	{
		id: "overheating",
		title: "Overheating",
		description:
			"A temperature sensor or thermal symptom indicates insufficient heat removal for the current load.",
		relatedModuleIds: ["cpu", "gpu", "cooling", "fans"],
		relatedFailureModeIds: [
			"gpu-thermal-throttling",
			"cpu-thermal-throttling",
			"fan-bearing-noise",
		],
		relatedCaseIds: ["case-03", "case-07"],
	},
	{
		id: "boot-failure",
		title: "Boot Failure",
		description:
			"The system cannot complete POST or load the operating system.",
		relatedModuleIds: ["motherboard", "ram", "storage", "psu", "cpu"],
		relatedFailureModeIds: [
			"motherboard-post-failure",
			"ram-memory-instability",
			"storage-health-degradation",
			"psu-power-instability",
		],
		relatedCaseIds: ["case-04", "case-05", "case-06"],
	},
	{
		id: "disk-slowness",
		title: "Disk Slowness",
		description:
			"Reads, writes or application launches take materially longer than expected.",
		relatedModuleIds: ["storage", "motherboard", "cpu"],
		relatedFailureModeIds: ["storage-health-degradation"],
		relatedCaseIds: ["case-05"],
	},
	{
		id: "application-crash",
		title: "Application Crash",
		description:
			"A workload exits unexpectedly; the same symptom can come from software, memory, GPU or storage.",
		relatedModuleIds: ["gpu", "ram", "cpu", "storage"],
		relatedFailureModeIds: [
			"gpu-driver-failure",
			"ram-memory-instability",
			"storage-health-degradation",
		],
		relatedCaseIds: ["case-03", "case-04", "case-05", "case-08"],
	},
	{
		id: "display-artifacts",
		title: "Display Artifacts",
		description:
			"Unexpected blocks, lines or corruption appear in rendered output.",
		relatedModuleIds: ["gpu", "display"],
		relatedFailureModeIds: ["gpu-driver-failure", "display-signal-path"],
		relatedCaseIds: ["case-03", "case-08"],
	},
	{
		id: "excessive-fan-noise",
		title: "Excessive Fan Noise",
		description:
			"Fans are louder or more erratic than expected for the current workload.",
		relatedModuleIds: ["fans", "cooling", "gpu", "psu"],
		relatedFailureModeIds: ["fan-bearing-noise", "cpu-thermal-throttling"],
		relatedCaseIds: ["case-07"],
	},
];

export const hardwareCases: HardwareCase[] = [
	{
		id: "case-01",
		title: "Intermittent no-display after a GPU swap",
		summary:
			"A black screen appeared after a graphics card change; the evidence path keeps display link, power and POST hypotheses open.",
		moduleIds: ["gpu", "display", "psu", "motherboard"],
		symptomIds: ["black-screen", "no-display-signal"],
		failureModeIds: ["display-signal-path", "gpu-power-delivery"],
		evidenceIds: ["ev-01a", "ev-01b"],
		evidence: [
			{
				id: "ev-01a",
				label: "Repro",
				value: "Blank output follows the new card across two boots",
				source: "Synthetic bench note",
			},
			{
				id: "ev-01b",
				label: "Discriminator",
				value: "Known-good cable restores link on the same monitor",
				source: "Synthetic bench note",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.78,
		verificationStatus: "synthetic",
	},
	{
		id: "case-02",
		title: "Reboots only when the GPU load changes",
		summary:
			"A load-transition symptom points toward power delivery while leaving thermals and board protection in the evidence chain.",
		moduleIds: ["psu", "gpu", "motherboard"],
		symptomIds: ["random-reboot", "black-screen"],
		failureModeIds: ["psu-power-instability", "gpu-power-delivery"],
		evidenceIds: ["ev-02a", "ev-02b"],
		evidence: [
			{
				id: "ev-02a",
				label: "Trigger",
				value: "Restart repeats at the start of a 3D workload",
				source: "Synthetic bench note",
			},
			{
				id: "ev-02b",
				label: "Safety",
				value: "No PSU enclosure inspection is recommended",
				source: "Safety boundary",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.71,
		verificationStatus: "synthetic",
	},
	{
		id: "case-03",
		title: "Frame drops with rising GPU temperature",
		summary:
			"Performance falls as the thermal control loop reduces clock headroom; validation focuses on trend rather than a single temperature number.",
		moduleIds: ["gpu", "cooling", "fans", "display"],
		symptomIds: ["low-fps", "stuttering", "overheating", "display-artifacts"],
		failureModeIds: ["gpu-thermal-throttling", "gpu-driver-failure"],
		evidenceIds: ["ev-03a", "ev-03b"],
		evidence: [
			{
				id: "ev-03a",
				label: "Trend",
				value: "Clock drops coincide with sustained load",
				source: "Synthetic telemetry trace",
			},
			{
				id: "ev-03b",
				label: "Check",
				value: "Clear airflow path and compare a repeatable workload",
				source: "Synthetic procedure",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.84,
		verificationStatus: "synthetic",
	},
	{
		id: "case-04",
		title: "BSODs that move with a DIMM",
		summary:
			"The failure follows a memory module or slot during a controlled test, separating memory instability from a GPU symptom.",
		moduleIds: ["ram", "cpu", "motherboard"],
		symptomIds: ["bsod", "application-crash", "boot-failure", "black-screen"],
		failureModeIds: ["ram-memory-instability"],
		evidenceIds: ["ev-04a", "ev-04b"],
		evidence: [
			{
				id: "ev-04a",
				label: "Isolation",
				value: "Boot result changes when one DIMM is removed",
				source: "Synthetic bench note",
			},
			{
				id: "ev-04b",
				label: "Next",
				value: "Run a bootable memory test at a safe profile",
				source: "Synthetic procedure",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.82,
		verificationStatus: "synthetic",
	},
	{
		id: "case-05",
		title: "Long application launches from a degrading SSD",
		summary:
			"Health counters and latency spikes support a storage path hypothesis before any replacement decision is made.",
		moduleIds: ["storage", "motherboard", "cpu"],
		symptomIds: ["disk-slowness", "boot-failure", "application-crash", "bsod"],
		failureModeIds: ["storage-health-degradation"],
		evidenceIds: ["ev-05a", "ev-05b"],
		evidence: [
			{
				id: "ev-05a",
				label: "Trend",
				value: "Latency spikes grow during ordinary reads",
				source: "Synthetic health snapshot",
			},
			{
				id: "ev-05b",
				label: "Guardrail",
				value: "Back up important files before stress testing",
				source: "Safety boundary",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.76,
		verificationStatus: "synthetic",
	},
	{
		id: "case-06",
		title: "POST LED stops at memory training",
		summary:
			"The board never reaches the operating system and a documented POST indicator narrows the path to firmware, RAM or board state.",
		moduleIds: ["motherboard", "ram", "cpu"],
		symptomIds: ["boot-failure", "black-screen", "no-display-signal"],
		failureModeIds: ["motherboard-post-failure", "ram-memory-instability"],
		evidenceIds: ["ev-06a", "ev-06b"],
		evidence: [
			{
				id: "ev-06a",
				label: "Boundary",
				value: "Failure occurs before the OS loader appears",
				source: "Synthetic bench note",
			},
			{
				id: "ev-06b",
				label: "Next",
				value: "Use the board manual's documented diagnostic code",
				source: "Synthetic procedure",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.69,
		verificationStatus: "synthetic",
	},
	{
		id: "case-07",
		title: "Fan surge and CPU clock drops",
		summary:
			"A noisy or obstructed cooling path can raise temperature and make the CPU lower frequency under sustained work.",
		moduleIds: ["cooling", "fans", "cpu"],
		symptomIds: [
			"overheating",
			"stuttering",
			"random-reboot",
			"excessive-fan-noise",
		],
		failureModeIds: ["cpu-thermal-throttling", "fan-bearing-noise"],
		evidenceIds: ["ev-07a", "ev-07b"],
		evidence: [
			{
				id: "ev-07a",
				label: "Correlation",
				value: "Noise rises before clocks fall",
				source: "Synthetic telemetry trace",
			},
			{
				id: "ev-07b",
				label: "Safety",
				value: "Do not touch moving blades; remove power before cleaning",
				source: "Safety boundary",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.74,
		verificationStatus: "synthetic",
	},
	{
		id: "case-08",
		title: "Artifacts isolated to one display link",
		summary:
			"Artifacts on one output path can be a cable, adapter or link-training problem rather than confirmed VRAM failure.",
		moduleIds: ["display", "gpu"],
		symptomIds: [
			"display-artifacts",
			"no-display-signal",
			"low-fps",
			"application-crash",
		],
		failureModeIds: ["display-signal-path", "gpu-driver-failure"],
		evidenceIds: ["ev-08a", "ev-08b"],
		evidence: [
			{
				id: "ev-08a",
				label: "Isolation",
				value: "A second output is clean on the same workload",
				source: "Synthetic bench note",
			},
			{
				id: "ev-08b",
				label: "Caution",
				value: "Do not equate one symptom with one failed component",
				source: "Reasoning boundary",
			},
		],
		sourceType: "Synthetic Demo",
		confidence: 0.67,
		verificationStatus: "synthetic",
	},
];

export const hardwareEvidence: EvidenceItem[] = hardwareCases.flatMap(
	(item) => item.evidence,
);

const moduleMap = new Map(hardwareModules.map((item) => [item.id, item]));
const failureMap = new Map(failureModes.map((item) => [item.id, item]));
const symptomMap = new Map(symptoms.map((item) => [item.id, item]));
const caseMap = new Map(hardwareCases.map((item) => [item.id, item]));

export function getHardwareModule(
	id: string | null | undefined,
): HardwareModule | undefined {
	return id ? moduleMap.get(id as HardwareModuleId) : undefined;
}
export function getFailureMode(
	id: string | null | undefined,
): FailureMode | undefined {
	return id ? failureMap.get(id as FailureModeId) : undefined;
}
export function getSymptom(id: string | null | undefined): Symptom | undefined {
	return id ? symptomMap.get(id as SymptomId) : undefined;
}
export function getHardwareCase(
	id: string | null | undefined,
): HardwareCase | undefined {
	return id ? caseMap.get(id) : undefined;
}

export function validateHardwareAtlasData(): string[] {
	const errors: string[] = [];
	for (const module of hardwareModules) {
		for (const id of [...module.failureModeIds, ...module.symptomIds])
			if (
				!failureMap.has(id as FailureModeId) &&
				!symptomMap.has(id as SymptomId)
			)
				errors.push(`${module.id} references unknown relation ${id}`);
		for (const id of module.connectedModuleIds)
			if (!moduleMap.has(id))
				errors.push(`${module.id} references unknown module ${id}`);
		for (const id of module.relatedCaseIds)
			if (!caseMap.has(id))
				errors.push(`${module.id} references unknown case ${id}`);
	}
	for (const failure of failureModes) {
		for (const id of failure.affectedModuleIds)
			if (!moduleMap.has(id))
				errors.push(`${failure.id} references unknown module ${id}`);
		for (const id of failure.symptomIds)
			if (!symptomMap.has(id))
				errors.push(`${failure.id} references unknown symptom ${id}`);
	}
	for (const symptom of symptoms) {
		for (const id of symptom.relatedModuleIds)
			if (!moduleMap.has(id))
				errors.push(`${symptom.id} references unknown module ${id}`);
		for (const id of symptom.relatedFailureModeIds)
			if (!failureMap.has(id))
				errors.push(`${symptom.id} references unknown failure ${id}`);
		for (const id of symptom.relatedCaseIds)
			if (!caseMap.has(id))
				errors.push(`${symptom.id} references unknown case ${id}`);
	}
	for (const item of hardwareCases) {
		for (const id of item.moduleIds)
			if (!moduleMap.has(id))
				errors.push(`${item.id} references unknown module ${id}`);
		for (const id of item.symptomIds)
			if (!symptomMap.has(id))
				errors.push(`${item.id} references unknown symptom ${id}`);
		for (const id of item.failureModeIds)
			if (!failureMap.has(id))
				errors.push(`${item.id} references unknown failure ${id}`);
		for (const id of item.evidenceIds)
			if (!item.evidence.some((evidence) => evidence.id === id))
				errors.push(`${item.id} references missing evidence ${id}`);
	}
	return errors;
}
