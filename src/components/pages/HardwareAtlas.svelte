<script lang="ts">
import { onMount } from "svelte";
import {
	type FailureMode,
	type FailureModeId,
	failureModes,
	getFailureMode,
	getHardwareCase,
	getHardwareModule,
	getSymptom,
	type HardwareCase,
	type HardwareModuleId,
	hardwareCases,
	hardwareModules,
	type SymptomId,
	symptoms,
} from "@/lib/ee-intelligence/hardware";

type AtlasMode = "component" | "fault";

let mode: AtlasMode = "component";
let selectedModuleId: HardwareModuleId = "gpu";
let selectedSymptomId: SymptomId | "" = "";
let selectedFailureModeId: FailureModeId | "" = "";
let selectedCaseId = "";
let graphFocus = "gpu";
let focusedCase: HardwareCase | undefined;

$: selectedModule = getHardwareModule(selectedModuleId) ?? hardwareModules[0]!;
$: selectedSymptom = getSymptom(selectedSymptomId);
$: selectedFailure = getFailureMode(selectedFailureModeId);
$: focusedCase = getHardwareCase(selectedCaseId);
$: relatedModules = selectedSymptom
	? selectedSymptom.relatedModuleIds
			.map((id) => getHardwareModule(id))
			.filter(Boolean)
	: selectedModule.connectedModuleIds
			.map((id) => getHardwareModule(id))
			.filter(Boolean);
$: visibleCases = selectedSymptom
	? hardwareCases.filter((item) => item.symptomIds.includes(selectedSymptom.id))
	: selectedFailure
		? hardwareCases.filter((item) =>
				item.failureModeIds.includes(selectedFailure.id),
			)
		: hardwareCases.filter((item) =>
				item.moduleIds.includes(selectedModule.id),
			);
$: selectedFailureModes = selectedModule.failureModeIds
	.map((id) => getFailureMode(id))
	.filter(Boolean) as FailureMode[];
$: activeVisualIds = new Set(
	selectedFailure
		? selectedFailure.affectedModuleIds
		: selectedSymptom
			? selectedSymptom.relatedModuleIds
			: [selectedModule.id, ...selectedModule.connectedModuleIds],
);

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	const module = getHardwareModule(params.get("module"));
	const symptom = getSymptom(params.get("symptom"));
	const failure = getFailureMode(params.get("fault"));
	const caseItem = getHardwareCase(params.get("case"));
	if (module) selectedModuleId = module.id;
	if (symptom) selectedSymptomId = symptom.id;
	if (failure) {
		selectedFailureModeId = failure.id;
		mode = "fault";
	}
	if (caseItem) selectedCaseId = caseItem.id;
});

function syncUrl() {
	const params = new URLSearchParams();
	if (selectedModuleId) params.set("module", selectedModuleId);
	if (selectedSymptomId) params.set("symptom", selectedSymptomId);
	if (selectedFailureModeId) params.set("fault", selectedFailureModeId);
	if (selectedCaseId) params.set("case", selectedCaseId);
	window.history.replaceState(
		{},
		"",
		`${window.location.pathname}?${params.toString()}`,
	);
}

function selectModule(id: HardwareModuleId) {
	selectedModuleId = id;
	selectedCaseId = "";
	graphFocus = id;
	if (
		!selectedFailureModeId ||
		!getHardwareModule(id)?.failureModeIds.includes(selectedFailureModeId)
	)
		selectedFailureModeId = "";
	syncUrl();
}

function selectSymptom(id: SymptomId) {
	selectedSymptomId = selectedSymptomId === id ? "" : id;
	selectedFailureModeId = "";
	mode = "component";
	selectedCaseId = "";
	graphFocus = id;
	syncUrl();
}

function selectFailure(id: FailureModeId) {
	selectedFailureModeId = id;
	mode = "fault";
	selectedSymptomId = "";
	selectedCaseId = "";
	graphFocus = id;
	syncUrl();
}

function inspectCase(id: string) {
	selectedCaseId = id;
	graphFocus = id;
	syncUrl();
}

function resetView() {
	mode = "component";
	selectedModuleId = "gpu";
	selectedSymptomId = "";
	selectedFailureModeId = "";
	selectedCaseId = "";
	graphFocus = "gpu";
	syncUrl();
}

function handleHotspotKey(event: KeyboardEvent, id: HardwareModuleId) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		selectModule(id);
	}
}

function moduleIsActive(id: HardwareModuleId) {
	return activeVisualIds.has(id);
}

function caseHref(id: string) {
	return `/tools/ee-intelligence/case-explorer/?case=${encodeURIComponent(id)}&module=${encodeURIComponent(selectedModule.id)}${selectedSymptom ? `&symptom=${encodeURIComponent(selectedSymptom.id)}` : ""}`;
}

function diagnosisHref() {
	const params = new URLSearchParams({ module: selectedModule.id });
	if (selectedSymptom) params.set("symptom", selectedSymptom.id);
	if (selectedFailure) params.set("fault", selectedFailure.id);
	return `/tools/ee-intelligence/diagnosis/?${params.toString()}`;
}

function severityClass(severity: FailureMode["severity"]) {
	return severity === "critical"
		? "critical"
		: severity === "warning"
			? "warning"
			: "watch";
}
</script>

<svelte:head>
	<title>Hardware Atlas · EE Intelligence</title>
	<meta name="description" content="Interactive PC anatomy, failure simulations and evidence-linked troubleshooting for EE Intelligence." />
</svelte:head>

<div class="atlas-shell">
	<header class="atlas-header">
		<div>
			<div class="atlas-eyebrow">EE INTELLIGENCE / PHASE 3</div>
			<h1>Hardware <span>Atlas</span></h1>
			<p>See the hardware. Understand the failure. Trace the evidence.</p>
		</div>
		<div class="header-actions">
			<div class="data-badge"><span class="pulse-dot"></span> SYNTHETIC DEMO · OFFLINE READY</div>
			<a href="/tools/ee-intelligence/" class="back-link">← EE Intelligence</a>
		</div>
	</header>

	<div class="simulation-banner" role="status">
		<span class="banner-icon">!</span>
		<div><strong>Educational Simulation — Not Live Hardware Telemetry</strong><p>Signals and cases are structured demo data. They illustrate reasoning paths and do not inspect this device.</p></div>
	</div>

	<div class="atlas-toolbar" role="toolbar" aria-label="Atlas view controls">
		<div class="mode-switch" role="group" aria-label="Atlas mode">
			<button class:active={mode === "component"} on:click={() => { mode = "component"; selectedFailureModeId = ""; syncUrl(); }} aria-pressed={mode === "component"}>COMPONENT MODE <small>anatomy</small></button>
			<button class:active={mode === "fault"} on:click={() => { mode = "fault"; if (!selectedFailureModeId) selectedFailureModeId = selectedModule.failureModeIds[0]!; syncUrl(); }} aria-pressed={mode === "fault"}>FAULT MODE <small>failure paths</small></button>
		</div>
		<button class="reset-button" on:click={resetView}>↺ Reset view</button>
	</div>

	<section class="atlas-main-grid">
		<div class="model-panel panel-surface">
			<div class="panel-heading"><div><span class="panel-kicker">01 · INTERACTIVE PC ANATOMY</span><h2>Open chassis / signal map</h2></div><span class="model-status"><i></i>{mode === "fault" ? "FAULT PATH ARMED" : "SELECT A MODULE"}</span></div>
			<div class="model-stage">
				<svg class="pc-svg" viewBox="0 0 760 520" role="img" aria-labelledby="pc-title pc-description">
					<title id="pc-title">Interactive open PC chassis</title>
					<desc id="pc-description">A side-on engineering diagram with clickable CPU, GPU, memory, storage, power supply, cooling, fans, motherboard and display output hotspots.</desc>
					<defs>
						<pattern id="atlas-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(117,210,224,.08)" stroke-width="1" /></pattern>
						<linearGradient id="case-glass" x1="0" x2="1"><stop offset="0" stop-color="#172331" /><stop offset="1" stop-color="#0f1722" /></linearGradient>
						<filter id="hot-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
					</defs>
					<rect x="26" y="24" width="682" height="452" rx="20" class="chassis" />
					<rect x="44" y="42" width="646" height="416" rx="12" fill="url(#case-glass)" class="inner-chassis" />
					<rect x="44" y="42" width="646" height="416" rx="12" fill="url(#atlas-grid)" />
					<path d="M 86 426 H 672 M 86 94 H 672" class="rail" />
					<path d="M 478 72 V 432 M 468 72 V 432" class="rail" />

					<!-- logical signal paths -->
					<path d="M 228 190 C 270 204 282 212 303 226 S 338 264 350 278" class:traced={moduleIsActive("cpu") || moduleIsActive("gpu")} class="signal-path cpu-gpu" />
					<path d="M 410 310 C 480 310 510 310 554 354" class:traced={moduleIsActive("gpu") || moduleIsActive("psu")} class="signal-path gpu-psu" />
					<path d="M 408 310 C 490 288 558 270 649 260" class:traced={moduleIsActive("gpu") || moduleIsActive("display")} class="signal-path gpu-display" />
					<path d="M 304 226 C 290 196 290 152 284 126" class:traced={moduleIsActive("cpu") || moduleIsActive("ram")} class="signal-path cpu-ram" />
					<path d="M 308 263 C 330 248 350 248 398 248" class:traced={moduleIsActive("motherboard") || moduleIsActive("storage")} class="signal-path board-storage" />

					<!-- motherboard -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("motherboard")} class:selected={selectedModule.id === "motherboard"} class="hotspot board-hotspot" role="button" tabindex="0" aria-label="Select Motherboard" on:click={() => selectModule("motherboard")} on:keydown={(event) => handleHotspotKey(event, "motherboard")}>
						<rect x="94" y="92" width="368" height="320" rx="8" class="board" />
						<path d="M 116 118 H 440 M 116 390 H 440 M 116 118 V 390 M 440 118 V 390" class="board-trace" />
						<text x="116" y="382" class="svg-label board-label">MOTHERBOARD / ATX</text>
						<circle cx="116" cy="116" r="5" class="mount" /><circle cx="440" cy="116" r="5" class="mount" /><circle cx="116" cy="388" r="5" class="mount" /><circle cx="440" cy="388" r="5" class="mount" />
					</g>

					<!-- cooling tower -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("cooling")} class:selected={selectedModule.id === "cooling"} class="hotspot" role="button" tabindex="0" aria-label="Select CPU Cooling" on:click={() => selectModule("cooling")} on:keydown={(event) => handleHotspotKey(event, "cooling")}>
						<rect x="130" y="104" width="134" height="34" rx="4" class="cooler" />
						<path d="M 140 110 V 132 M 152 110 V 132 M 164 110 V 132 M 176 110 V 132 M 188 110 V 132 M 200 110 V 132 M 212 110 V 132 M 224 110 V 132 M 236 110 V 132" class="cooler-fin" />
						<text x="138" y="128" class="svg-label">COOLING</text>
					</g>

					<!-- CPU -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("cpu")} class:selected={selectedModule.id === "cpu"} class="hotspot" role="button" tabindex="0" aria-label="Select CPU" on:click={() => selectModule("cpu")} on:keydown={(event) => handleHotspotKey(event, "cpu")}>
						<rect x="148" y="148" width="98" height="82" rx="10" class="cpu" />
						<rect x="163" y="162" width="68" height="54" rx="4" class="cpu-die" /><path d="M 155 160 H 148 M 155 176 H 148 M 155 192 H 148 M 155 208 H 148 M 239 160 H 246 M 239 176 H 246 M 239 192 H 246 M 239 208 H 246" class="pins" />
						<text x="179" y="194" class="svg-label cpu-label">CPU</text>
					</g>

					<!-- RAM -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("ram")} class:selected={selectedModule.id === "ram"} class="hotspot" role="button" tabindex="0" aria-label="Select RAM" on:click={() => selectModule("ram")} on:keydown={(event) => handleHotspotKey(event, "ram")}>
						<rect x="276" y="132" width="22" height="116" rx="3" class="ram-stick" /><rect x="306" y="132" width="22" height="116" rx="3" class="ram-stick second" />
						<path d="M 282 146 H 292 M 282 159 H 292 M 282 172 H 292 M 282 185 H 292 M 282 198 H 292 M 282 211 H 292 M 312 146 H 322 M 312 159 H 322 M 312 172 H 322 M 312 185 H 322 M 312 198 H 322 M 312 211 H 322" class="ram-chip" />
						<text x="278" y="263" class="svg-label">RAM / DDR5</text>
					</g>

					<!-- storage -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("storage")} class:selected={selectedModule.id === "storage"} class="hotspot" role="button" tabindex="0" aria-label="Select NVMe SSD" on:click={() => selectModule("storage")} on:keydown={(event) => handleHotspotKey(event, "storage")}>
						<rect x="314" y="252" width="102" height="22" rx="4" class="ssd" /><circle cx="329" cy="263" r="4" class="ssd-led" /><text x="341" y="267" class="svg-label">NVMe SSD</text>
					</g>

					<!-- GPU -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("gpu")} class:selected={selectedModule.id === "gpu"} class:faulted={mode === "fault" && selectedFailure?.affectedModuleIds.includes("gpu")} class="hotspot" role="button" tabindex="0" aria-label="Select GPU" on:click={() => selectModule("gpu")} on:keydown={(event) => handleHotspotKey(event, "gpu")}>
						<rect x="132" y="278" width="276" height="62" rx="7" class="gpu" /><rect x="154" y="288" width="114" height="42" rx="3" class="gpu-shroud" /><rect x="284" y="288" width="114" height="42" rx="3" class="gpu-shroud" /><circle cx="198" cy="309" r="15" class="gpu-fan" /><circle cx="328" cy="309" r="15" class="gpu-fan" /><circle cx="198" cy="309" r="5" class="fan-hub" /><circle cx="328" cy="309" r="5" class="fan-hub" /><path d="M 416 294 H 438 V 324 H 416" class="gpu-edge" /><text x="216" y="315" class="svg-label gpu-label">GPU / VRAM</text>
					</g>

					<!-- fans -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("fans")} class:selected={selectedModule.id === "fans"} class="hotspot" role="button" tabindex="0" aria-label="Select Case Fans" on:click={() => selectModule("fans")} on:keydown={(event) => handleHotspotKey(event, "fans")}>
						<circle cx="570" cy="145" r="43" class="case-fan" /><circle cx="570" cy="145" r="10" class="fan-hub" /><path d="M 570 135 C 548 110 551 104 568 104 C 580 106 582 119 576 135 M 580 145 C 605 123 612 128 611 144 C 610 157 597 160 580 154 M 570 155 C 591 180 587 186 572 186 C 558 185 557 171 564 155 M 560 145 C 536 166 529 159 530 145 C 531 132 543 130 560 136" class="fan-blade" />
						<text x="535" y="206" class="svg-label">CASE FAN</text>
					</g>

					<!-- PSU -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("psu")} class:selected={selectedModule.id === "psu"} class:faulted={mode === "fault" && selectedFailure?.affectedModuleIds.includes("psu")} class="hotspot" role="button" tabindex="0" aria-label="Select Power Supply" on:click={() => selectModule("psu")} on:keydown={(event) => handleHotspotKey(event, "psu")}>
						<rect x="490" y="332" width="180" height="102" rx="7" class="psu" /><circle cx="545" cy="382" r="32" class="psu-fan" /><circle cx="545" cy="382" r="7" class="fan-hub" /><path d="M 545 375 L 523 360 M 552 382 L 571 361 M 545 389 L 567 403 M 538 382 L 519 401" class="psu-blades" /><text x="590" y="382" class="svg-label">PSU</text><text x="590" y="399" class="svg-small">POWER DELIVERY</text>
					</g>

					<!-- display output -->
					<g class:dimmed={mode === "fault" && !moduleIsActive("display")} class:selected={selectedModule.id === "display"} class:faulted={mode === "fault" && selectedFailure?.affectedModuleIds.includes("display")} class="hotspot" role="button" tabindex="0" aria-label="Select Display Output" on:click={() => selectModule("display")} on:keydown={(event) => handleHotspotKey(event, "display")}>
						<rect x="648" y="239" width="62" height="44" rx="5" class="display-port" /><rect x="658" y="249" width="42" height="24" rx="2" class="port-inner" /><text x="654" y="303" class="svg-label">DISPLAY OUT</text>
					</g>
					<text x="58" y="452" class="svg-caption">CLICKABLE HOTSPOTS · KEYBOARD FOCUS ENABLED</text>
				</svg>
			</div>
			<div class="model-legend"><span><i class="legend-dot cyan"></i>signal path</span><span><i class="legend-dot amber"></i>warning / power</span><span><i class="legend-dot violet"></i>compute / thermal</span><span>focus: <b>{selectedModule.name}</b></span></div>
		</div>

		<aside class="inspector panel-surface" aria-live="polite">
			<div class="panel-heading"><div><span class="panel-kicker">02 · MODULE INSPECTOR</span><h2>{selectedModule.name} <small>{selectedModule.nameZh}</small></h2></div><span class={`severity-tag ${selectedFailure ? severityClass(selectedFailure.severity) : "ready"}`}>{selectedFailure ? selectedFailure.severity.toUpperCase() : "READY"}</span></div>
			<div class="inspector-intro"><span class="module-category">{selectedModule.category}</span><p>{selectedModule.simpleDescription}</p><p class="engineering-copy"><strong>Engineering role</strong>{selectedModule.engineeringRole}</p></div>
			{#if selectedFailure}
				<div class="fault-card"><div class="fault-card-top"><span class="panel-kicker">FAILURE SCENARIO</span><span class={`severity-tag ${severityClass(selectedFailure.severity)}`}>{selectedFailure.title}</span></div><p>{selectedFailure.description}</p><div class="indicator-list"><strong>Validate with</strong>{#each selectedFailure.diagnosticIndicators as indicator}<span>↳ {indicator}</span>{/each}</div></div>
			{:else}
				<div class="inspector-section"><div class="subheading"><h3>Common failure modes</h3><span>{selectedFailureModes.length} mapped</span></div><div class="failure-list">{#each selectedFailureModes as failure}<button class="failure-row" on:click={() => selectFailure(failure.id)}><span class={`failure-mark ${severityClass(failure.severity)}`}></span><span><strong>{failure.title}</strong><small>{failure.description}</small></span><span class="row-arrow">→</span></button>{/each}</div></div>
			{/if}
			<div class="inspector-section"><div class="subheading"><h3>Typical symptoms</h3><span>click to trace</span></div><div class="pill-grid">{#each selectedModule.symptomIds as id}{#if getSymptom(id)}<button class:active={selectedSymptomId === id} class="symptom-pill" on:click={() => selectSymptom(id)}>{getSymptom(id)?.title}</button>{/if}{/each}</div></div>
			<div class="inspector-section"><div class="subheading"><h3>Quick checks</h3><span>safe first</span></div><ol class="quick-checks">{#each (selectedFailure?.quickChecks ?? ["Confirm the symptom is repeatable and record what changed", "Use software logs or vendor diagnostics before opening the chassis", "Power down and unplug before touching internal hardware"]) as check}<li>{check}</li>{/each}</ol></div>
			<div class="inspector-section"><div class="subheading"><h3>System connections</h3><span>{selectedModule.connectedModuleIds.length} linked</span></div><div class="connection-list">{#each selectedModule.connectedModuleIds as id}{#if getHardwareModule(id)}<button class:active={selectedModuleId === id} on:click={() => selectModule(id)}><span class="connection-line"></span>{getHardwareModule(id)?.name}<span>↗</span></button>{/if}{/each}</div></div>
			<div class="inspector-actions"><a class="primary-cta" href={diagnosisHref()}>Run Diagnosis <span>→</span></a><a class="secondary-cta" href={caseHref(visibleCases[0]?.id ?? "case-01")}>Open Case Explorer <span>↗</span></a></div>
		</aside>
	</section>

	{#if selectedFailure}
		<section class="fault-visual panel-surface"><div class="panel-heading"><div><span class="panel-kicker">03 · FAULT VISUALIZATION</span><h2>{selectedFailure.title}</h2></div><span class="sim-tag">SIMULATION ACTIVE</span></div><div class="fault-layout"><div class="fault-copy"><p>{selectedFailure.description}</p><div class="fault-state"><span class="state-glyph">⌁</span><div><strong>{selectedFailure.affectedModuleIds.length} modules in path</strong><small>Highlighted nodes are possible contributors, not confirmed failures.</small></div></div></div><div class="fault-metrics"><div><span>OBSERVABLE TREND</span><strong>{selectedFailure.id === "gpu-thermal-throttling" ? "clock headroom ↓" : selectedFailure.id === "psu-power-instability" ? "load transition → reset" : "memory state → error"}</strong></div><div><span>VALIDATION SIGNAL</span><strong>{selectedFailure.diagnosticIndicators[0]}</strong></div><div><span>EXPECTED SYMPTOMS</span><strong>{selectedFailure.symptomIds.map((id) => getSymptom(id)?.title).join(" · ")}</strong></div></div></div></section>
	{/if}

	<section class="symptom-section"><div class="section-title"><div><span class="panel-kicker">04 · SYMPTOM EXPLORER</span><h2>Start from what you can observe</h2><p>One symptom can map to several modules. Select a symptom to keep uncertainty visible while tracing possible causes.</p></div><span class="count-badge">{symptoms.length} symptoms</span></div><div class="symptom-matrix">{#each symptoms as symptom}<button class:active={selectedSymptomId === symptom.id} class="symptom-card" on:click={() => selectSymptom(symptom.id)}><span class="symptom-card-icon">{symptom.id === "black-screen" || symptom.id === "no-display-signal" ? "◌" : symptom.id === "overheating" || symptom.id === "excessive-fan-noise" ? "⌁" : symptom.id === "bsod" ? "▦" : "⊙"}</span><span><strong>{symptom.title}</strong><small>{symptom.relatedModuleIds.length} possible modules · {symptom.relatedCaseIds.length} cases</small></span><span class="card-chevron">→</span></button>{/each}</div></section>

	<section class="trace-section panel-surface"><div class="section-title"><div><span class="panel-kicker">05 · KNOWLEDGE CONNECTION</span><h2>Trace the evidence chain</h2><p>Each node is a real relation in the local atlas data. Click a node to update the working context.</p></div><span class="trace-caption">MODULE → FAILURE → SYMPTOM → CASE → EVIDENCE</span></div><div class="trace-grid"><div class="trace-column"><span class="trace-label">HARDWARE</span><button class:focused={graphFocus === selectedModule.id} class="trace-node module-node" on:click={() => { graphFocus = selectedModule.id; selectModule(selectedModule.id); }}>{selectedModule.name}<small>{selectedModule.nameZh}</small></button><span class="trace-connector">↓</span></div><div class="trace-column"><span class="trace-label">FAILURE MODE</span>{#if selectedFailure}<button class:focused={graphFocus === selectedFailure.id} class="trace-node failure-node" on:click={() => selectFailure(selectedFailure.id)}>{selectedFailure.title}<small>{selectedFailure.severity}</small></button>{:else}<button class="trace-node failure-node" on:click={() => selectFailure(selectedFailureModes[0]?.id ?? "gpu-thermal-throttling")}>{selectedFailureModes[0]?.title ?? "Choose a failure"}<small>click to simulate</small></button>{/if}<span class="trace-connector">↓</span></div><div class="trace-column"><span class="trace-label">SYMPTOM</span>{#if selectedSymptom}<button class:focused={graphFocus === selectedSymptom.id} class="trace-node symptom-node" on:click={() => selectSymptom(selectedSymptom.id)}>{selectedSymptom.title}<small>{selectedSymptom.relatedModuleIds.length} possible modules</small></button>{:else}<button class="trace-node symptom-node" on:click={() => selectSymptom(selectedModule.symptomIds[0]!)}>{getSymptom(selectedModule.symptomIds[0])?.title}<small>click to explore</small></button>{/if}<span class="trace-connector">↓</span></div><div class="trace-column"><span class="trace-label">CASE</span>{#if visibleCases[0]}<a class:focused={graphFocus === visibleCases[0].id} class="trace-node case-node" href={caseHref(visibleCases[0].id)} on:click={() => inspectCase(visibleCases[0]!.id)}>{visibleCases[0].title}<small>{visibleCases[0].sourceType}</small></a>{:else}<span class="trace-node case-node empty">No mapped case</span>{/if}<span class="trace-connector">↓</span></div><div class="trace-column"><span class="trace-label">EVIDENCE</span>{#if visibleCases[0]?.evidence[0]}<button class="trace-node evidence-node" on:click={() => inspectCase(visibleCases[0]!.id)}>{visibleCases[0].evidence[0].label}<small>{visibleCases[0].evidence[0].value}</small></button>{:else}<span class="trace-node evidence-node empty">Awaiting context</span>{/if}</div></div></section>

	<section class="cases-section"><div class="section-title"><div><span class="panel-kicker">06 · RELATED CASES</span><h2>{selectedSymptom ? selectedSymptom.title : selectedFailure ? selectedFailure.title : selectedModule.name} evidence queue</h2><p>All records are marked by source status. Synthetic demos are reasoning fixtures, not verified repair records.</p></div><a class="secondary-cta" href={`/tools/ee-intelligence/case-explorer/?module=${selectedModule.id}`}>View all cases <span>↗</span></a></div><div class="case-grid">{#each visibleCases.slice(0, 4) as item}<article class:selected={focusedCase?.id === item.id} class="case-card"><div class="case-card-top"><span class="case-id">{item.id.toUpperCase()}</span><span class="source-status">{item.sourceType}</span></div><h3>{item.title}</h3><p>{item.summary}</p><div class="case-card-meta"><span>{Math.round(item.confidence * 100)}% confidence</span><span>{item.evidence.length} evidence items</span></div><div class="case-card-actions"><a href={caseHref(item.id)} on:click={() => inspectCase(item.id)}>Inspect case <span>→</span></a><a href={`/tools/ee-intelligence/diagnosis/?module=${item.moduleIds[0]}&symptom=${item.symptomIds[0]}&fault=${item.failureModeIds[0]}`}>Run diagnosis</a></div></article>{:else}<div class="empty-case">No cases mapped for this context yet.</div>{/each}</div></section>

	<footer class="atlas-footer"><span>HARDWARE ATLAS · STATIC KNOWLEDGE SURFACE</span><span>Educational simulation · no live telemetry · <a href="/tools/ee-intelligence/">Return to EE Intelligence</a></span></footer>
</div>

<style>
	.atlas-shell { --atlas-bg: #071017; --atlas-panel: #0b1720; --atlas-panel-2: #0f1e29; --atlas-line: rgba(151, 203, 216, .16); --atlas-line-strong: rgba(117, 210, 224, .42); --atlas-ink: #d9edf0; --atlas-muted: #8aa4aa; --atlas-cyan: #75d2e0; --atlas-teal: #4ab7a7; --atlas-amber: #e2ae62; --atlas-red: #ef716d; --atlas-violet: #9c8df4; width: min(1440px, calc(100% - 2rem)); margin: 0 auto; padding: 1.25rem 1.25rem 3.5rem; box-sizing: border-box; border: 1px solid rgba(117,210,224,.15); background: radial-gradient(circle at 12% 0%, rgba(35,93,112,.18), transparent 36%), var(--atlas-bg); color: var(--atlas-ink); font-family: var(--font-sans, system-ui, sans-serif); }
	.atlas-shell :is(button, a) { -webkit-tap-highlight-color: transparent; }.atlas-shell button, .atlas-shell a { font: inherit; }.atlas-shell button:focus-visible, .atlas-shell a:focus-visible { outline: 2px solid var(--atlas-cyan); outline-offset: 3px; }
	.atlas-header { display: flex; justify-content: space-between; align-items: end; gap: 1rem; padding: 1.2rem 0 1.4rem; border-bottom: 1px solid var(--atlas-line); }.atlas-eyebrow, .panel-kicker, .trace-label { color: var(--atlas-cyan); font: 700 .65rem/1.2 ui-monospace, SFMono-Regular, monospace; letter-spacing: .14em; text-transform: uppercase; }.atlas-header h1 { margin: .45rem 0 .25rem; font-size: clamp(2.25rem, 5vw, 4.3rem); line-height: .92; letter-spacing: -.065em; }.atlas-header h1 span { color: var(--atlas-cyan); }.atlas-header p { margin: 0; color: var(--atlas-muted); font-size: .86rem; }.header-actions { display: grid; justify-items: end; gap: .65rem; }.data-badge, .sim-tag, .count-badge { border: 1px solid var(--atlas-line-strong); padding: .38rem .55rem; color: var(--atlas-cyan); font: 700 .62rem ui-monospace, monospace; letter-spacing: .05em; }.pulse-dot { display: inline-block; width: .4rem; height: .4rem; margin-right: .35rem; border-radius: 50%; background: var(--atlas-teal); box-shadow: 0 0 0 .25rem rgba(74,183,167,.12); }.back-link, .atlas-footer a { color: var(--atlas-muted); font-size: .72rem; text-decoration: none; }.back-link:hover, .atlas-footer a:hover { color: var(--atlas-cyan); }
	.simulation-banner { display: flex; gap: .7rem; align-items: flex-start; margin: 1rem 0; padding: .75rem .9rem; border: 1px solid rgba(226,174,98,.42); border-left: 3px solid var(--atlas-amber); background: rgba(226,174,98,.08); }.banner-icon { display: grid; width: 1.35rem; height: 1.35rem; flex: 0 0 auto; place-items: center; border: 1px solid var(--atlas-amber); color: var(--atlas-amber); font-weight: 800; }.simulation-banner strong { font-size: .77rem; }.simulation-banner p { margin: .2rem 0 0; color: var(--atlas-muted); font-size: .7rem; line-height: 1.45; }
	.atlas-toolbar { display: flex; justify-content: space-between; gap: .8rem; align-items: center; margin: .8rem 0; }.mode-switch { display: flex; gap: .35rem; }.mode-switch button, .reset-button { border: 1px solid var(--atlas-line); background: var(--atlas-panel); color: var(--atlas-muted); cursor: pointer; }.mode-switch button { display: flex; gap: .4rem; align-items: center; padding: .5rem .65rem; font: 700 .62rem ui-monospace, monospace; }.mode-switch button small { color: var(--atlas-muted); font: .6rem system-ui, sans-serif; }.mode-switch button.active, .mode-switch button:hover, .reset-button:hover { border-color: var(--atlas-cyan); color: var(--atlas-cyan); background: rgba(117,210,224,.08); }.reset-button { padding: .5rem .65rem; font-size: .72rem; cursor: pointer; }
	.panel-surface { border: 1px solid var(--atlas-line); background: linear-gradient(135deg, rgba(14,31,42,.96), rgba(7,16,23,.98)); box-shadow: 0 14px 36px rgba(0,0,0,.16); }.atlas-main-grid { display: grid; grid-template-columns: minmax(0, 1.67fr) minmax(21rem, .83fr); gap: 1rem; align-items: start; }.model-panel { min-width: 0; padding: 1rem; }.panel-heading, .section-title { display: flex; justify-content: space-between; align-items: start; gap: .75rem; }.panel-heading h2, .section-title h2 { margin: .4rem 0 0; font-size: 1.2rem; letter-spacing: -.025em; }.panel-heading h2 small { margin-left: .3rem; color: var(--atlas-muted); font-size: .76rem; font-weight: 500; }.model-status { color: var(--atlas-muted); font: 700 .58rem ui-monospace, monospace; letter-spacing: .07em; }.model-status i { display: inline-block; width: .42rem; height: .42rem; margin-right: .28rem; border-radius: 50%; background: var(--atlas-cyan); }.model-stage { margin-top: .8rem; overflow: hidden; border: 1px solid var(--atlas-line); background: radial-gradient(circle at 55% 40%, rgba(37,93,109,.16), transparent 48%), var(--atlas-bg); }.pc-svg { display: block; width: 100%; min-height: 410px; }.chassis { fill: #0a151e; stroke: rgba(117,210,224,.38); stroke-width: 2; }.inner-chassis { stroke: rgba(117,210,224,.12); stroke-width: 1; }.rail { fill: none; stroke: rgba(117,210,224,.12); stroke-width: 1; stroke-dasharray: 5 9; }.signal-path { fill: none; stroke: rgba(117,210,224,.2); stroke-width: 2; stroke-dasharray: 5 7; transition: stroke .2s, filter .2s, opacity .2s; }.signal-path.traced { stroke: var(--atlas-cyan); stroke-width: 3; filter: url(#hot-glow); opacity: .9; }.board { fill: #0d2b2f; stroke: rgba(74,183,167,.62); stroke-width: 2; }.board-trace { fill: none; stroke: rgba(74,183,167,.3); stroke-width: 1; stroke-dasharray: 2 7; }.mount { fill: #061017; stroke: rgba(117,210,224,.5); stroke-width: 2; }.cooler { fill: #252651; stroke: rgba(156,141,244,.7); stroke-width: 2; }.cooler-fin { stroke: rgba(156,141,244,.55); stroke-width: 2; }.cpu { fill: #1b1b42; stroke: rgba(156,141,244,.75); stroke-width: 2; }.cpu-die { fill: #2b2870; stroke: rgba(156,141,244,.65); }.pins { stroke: rgba(156,141,244,.75); stroke-width: 2; stroke-dasharray: 3 4; }.ram-stick { fill: #705a20; stroke: rgba(226,174,98,.86); stroke-width: 2; }.ram-stick.second { fill: #594a24; }.ram-chip { stroke: rgba(247,217,135,.7); stroke-width: 1.5; }.ssd { fill: #124541; stroke: rgba(74,183,167,.8); stroke-width: 2; }.ssd-led { fill: var(--atlas-teal); }.gpu { fill: #123542; stroke: rgba(117,210,224,.9); stroke-width: 2; }.gpu-shroud { fill: #0b222d; stroke: rgba(117,210,224,.35); }.gpu-fan, .psu-fan { fill: #0a1a24; stroke: rgba(117,210,224,.65); stroke-width: 2; }.fan-blade, .psu-blades { fill: none; stroke: rgba(117,210,224,.6); stroke-width: 3; }.fan-hub { fill: var(--atlas-cyan); }.gpu-edge { fill: none; stroke: var(--atlas-cyan); stroke-width: 2; }.case-fan { fill: rgba(74,183,167,.08); stroke: rgba(74,183,167,.72); stroke-width: 2; }.fan-blade { stroke: rgba(74,183,167,.75); }.psu { fill: #39291d; stroke: rgba(226,174,98,.8); stroke-width: 2; }.display-port { fill: #113440; stroke: rgba(117,210,224,.8); stroke-width: 2; }.port-inner { fill: #061017; stroke: rgba(117,210,224,.45); }.svg-label { fill: var(--atlas-ink); font: 700 10px ui-monospace, monospace; letter-spacing: .06em; }.board-label { fill: rgba(217,237,240,.56); }.svg-small { fill: rgba(217,237,240,.52); font: 7px ui-monospace, monospace; letter-spacing: .08em; }.svg-caption { fill: rgba(138,164,170,.6); font: 8px ui-monospace, monospace; letter-spacing: .12em; }.hotspot { cursor: pointer; transform-box: fill-box; transform-origin: center; transition: opacity .2s, filter .2s, transform .2s; }.hotspot:hover, .hotspot.selected { filter: url(#hot-glow); }.hotspot.selected { transform: scale(1.025); }.hotspot.dimmed { opacity: .22; }.hotspot.faulted { filter: drop-shadow(0 0 8px rgba(226,174,98,.8)); }.hotspot.faulted :is(.gpu, .psu) { stroke: var(--atlas-amber); }.model-legend { display: flex; flex-wrap: wrap; gap: .7rem 1rem; padding-top: .65rem; color: var(--atlas-muted); font: .65rem ui-monospace, monospace; }.model-legend span { display: inline-flex; align-items: center; gap: .3rem; }.legend-dot { width: .48rem; height: .48rem; border-radius: 50%; background: var(--atlas-cyan); }.legend-dot.amber { background: var(--atlas-amber); }.legend-dot.violet { background: var(--atlas-violet); }.model-legend b { color: var(--atlas-ink); }
	.inspector { min-width: 0; padding: 1rem; position: sticky; top: 1rem; }.severity-tag { border: 1px solid var(--atlas-line); padding: .28rem .4rem; font: 700 .56rem ui-monospace, monospace; letter-spacing: .08em; }.severity-tag.ready, .severity-tag.watch { color: var(--atlas-cyan); border-color: var(--atlas-line-strong); }.severity-tag.warning { color: var(--atlas-amber); border-color: rgba(226,174,98,.6); }.severity-tag.critical { color: var(--atlas-red); border-color: rgba(239,113,109,.65); }.inspector-intro { margin-top: .9rem; }.module-category { color: var(--atlas-teal); font: 700 .61rem ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }.inspector-intro p { margin: .45rem 0 0; color: var(--atlas-muted); font-size: .76rem; line-height: 1.5; }.engineering-copy { display: grid; gap: .15rem; padding: .65rem; border-left: 2px solid var(--atlas-line-strong); background: rgba(117,210,224,.035); }.engineering-copy strong { color: var(--atlas-ink); font-size: .65rem; font-family: ui-monospace, monospace; text-transform: uppercase; }.inspector-section { margin-top: 1rem; }.subheading { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }.subheading h3 { margin: 0; font-size: .82rem; }.subheading span { color: var(--atlas-muted); font: .6rem ui-monospace, monospace; }.failure-list { display: grid; gap: .35rem; margin-top: .55rem; }.failure-row { display: grid; grid-template-columns: .45rem 1fr auto; gap: .55rem; align-items: start; padding: .55rem; border: 1px solid var(--atlas-line); background: rgba(255,255,255,.018); color: var(--atlas-ink); text-align: left; cursor: pointer; }.failure-row:hover { border-color: var(--atlas-line-strong); background: rgba(117,210,224,.06); }.failure-row strong, .failure-row small { display: block; }.failure-row strong { font-size: .7rem; }.failure-row small { margin-top: .18rem; color: var(--atlas-muted); font-size: .63rem; line-height: 1.35; }.row-arrow { color: var(--atlas-cyan); }.failure-mark { width: .42rem; height: .42rem; margin-top: .17rem; border-radius: 50%; background: var(--atlas-cyan); }.failure-mark.warning { background: var(--atlas-amber); }.failure-mark.critical { background: var(--atlas-red); }.failure-mark.watch { background: var(--atlas-cyan); }.pill-grid { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .55rem; }.symptom-pill { border: 1px solid var(--atlas-line); padding: .35rem .45rem; background: transparent; color: var(--atlas-muted); font-size: .63rem; cursor: pointer; }.symptom-pill:hover, .symptom-pill.active { border-color: var(--atlas-cyan); color: var(--atlas-cyan); background: rgba(117,210,224,.07); }.quick-checks { display: grid; gap: .45rem; margin: .55rem 0 0; padding-left: 1.05rem; color: var(--atlas-muted); font-size: .68rem; line-height: 1.42; }.quick-checks li::marker { color: var(--atlas-amber); font-family: ui-monospace, monospace; }.connection-list { display: grid; gap: .25rem; margin-top: .5rem; }.connection-list button { display: flex; gap: .4rem; align-items: center; border: 0; border-bottom: 1px solid var(--atlas-line); padding: .35rem 0; background: none; color: var(--atlas-muted); text-align: left; font-size: .68rem; cursor: pointer; }.connection-list button:hover, .connection-list button.active { color: var(--atlas-cyan); }.connection-list button > span:last-child { margin-left: auto; color: var(--atlas-cyan); }.connection-line { width: 1.25rem; height: 1px; background: var(--atlas-line-strong); }.inspector-actions { display: grid; gap: .45rem; margin-top: 1rem; }.primary-cta, .secondary-cta { display: flex; justify-content: space-between; align-items: center; gap: .5rem; padding: .58rem .65rem; text-decoration: none; font: 700 .65rem ui-monospace, monospace; }.primary-cta { border: 1px solid var(--atlas-cyan); background: var(--atlas-cyan); color: #061017; }.secondary-cta { border: 1px solid var(--atlas-line-strong); background: transparent; color: var(--atlas-cyan); }.primary-cta:hover { filter: brightness(1.08); }.secondary-cta:hover { background: rgba(117,210,224,.07); }.fault-card { margin-top: .85rem; padding: .7rem; border: 1px solid rgba(226,174,98,.45); background: rgba(226,174,98,.06); }.fault-card-top { display: flex; justify-content: space-between; gap: .4rem; align-items: start; }.fault-card p { margin: .55rem 0; color: var(--atlas-muted); font-size: .7rem; line-height: 1.45; }.indicator-list { display: grid; gap: .3rem; border-top: 1px solid rgba(226,174,98,.25); padding-top: .5rem; color: var(--atlas-amber); font-size: .63rem; }.indicator-list strong { color: var(--atlas-ink); font: 700 .6rem ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
	.fault-visual { margin-top: 1rem; padding: 1rem; border-color: rgba(226,174,98,.35); }.fault-layout { display: grid; grid-template-columns: .8fr 1.2fr; gap: 1rem; margin-top: .8rem; }.fault-copy p { margin: 0; color: var(--atlas-muted); font-size: .75rem; line-height: 1.5; }.fault-state { display: flex; gap: .55rem; align-items: center; margin-top: .8rem; padding: .65rem; border-left: 2px solid var(--atlas-amber); background: rgba(226,174,98,.07); }.state-glyph { color: var(--atlas-amber); font-size: 1.35rem; }.fault-state strong, .fault-state small { display: block; }.fault-state strong { font-size: .72rem; }.fault-state small { margin-top: .18rem; color: var(--atlas-muted); font-size: .63rem; }.fault-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: .45rem; }.fault-metrics div { min-width: 0; padding: .65rem; border: 1px solid var(--atlas-line); background: rgba(255,255,255,.02); }.fault-metrics span { display: block; color: var(--atlas-muted); font: 700 .56rem ui-monospace, monospace; letter-spacing: .06em; }.fault-metrics strong { display: block; margin-top: .35rem; color: var(--atlas-amber); font-size: .7rem; line-height: 1.35; }
	.symptom-section, .cases-section { margin-top: 1.8rem; }.section-title p { max-width: 48rem; margin: .35rem 0 0; color: var(--atlas-muted); font-size: .75rem; line-height: 1.45; }.count-badge { white-space: nowrap; }.symptom-matrix { display: grid; grid-template-columns: repeat(4, 1fr); gap: .45rem; margin-top: .8rem; }.symptom-card { display: grid; grid-template-columns: 1.4rem 1fr auto; gap: .45rem; align-items: center; min-width: 0; padding: .65rem; border: 1px solid var(--atlas-line); background: var(--atlas-panel); color: var(--atlas-ink); text-align: left; cursor: pointer; }.symptom-card:hover, .symptom-card.active { border-color: var(--atlas-cyan); background: rgba(117,210,224,.07); }.symptom-card-icon { color: var(--atlas-cyan); font-size: 1.05rem; }.symptom-card strong, .symptom-card small { display: block; }.symptom-card strong { font-size: .7rem; }.symptom-card small { margin-top: .18rem; color: var(--atlas-muted); font-size: .59rem; }.card-chevron { color: var(--atlas-muted); }.symptom-card:hover .card-chevron, .symptom-card.active .card-chevron { color: var(--atlas-cyan); }
	.trace-section { margin-top: 1.8rem; padding: 1rem; }.trace-caption { color: var(--atlas-muted); font: .58rem ui-monospace, monospace; letter-spacing: .08em; }.trace-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: .35rem; margin-top: 1rem; }.trace-column { position: relative; min-width: 0; }.trace-label { display: block; margin-bottom: .4rem; color: var(--atlas-muted); font-size: .57rem; }.trace-node { display: grid; gap: .3rem; width: 100%; min-height: 4.25rem; align-content: center; padding: .55rem; border: 1px solid var(--atlas-line); background: rgba(255,255,255,.02); color: var(--atlas-ink); text-align: left; text-decoration: none; cursor: pointer; }.trace-node small { color: var(--atlas-muted); font-size: .6rem; line-height: 1.35; }.trace-node:hover, .trace-node.focused { border-color: var(--atlas-cyan); box-shadow: inset 0 2px 0 var(--atlas-cyan); }.module-node { border-color: rgba(74,183,167,.5); }.failure-node { border-color: rgba(226,174,98,.5); }.symptom-node { border-color: rgba(117,210,224,.5); }.case-node { border-color: rgba(156,141,244,.5); }.evidence-node { border-color: rgba(74,183,167,.5); }.trace-node.empty { color: var(--atlas-muted); cursor: default; }.trace-connector { display: none; }
	.case-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .55rem; margin-top: .8rem; }.case-card { display: flex; flex-direction: column; min-width: 0; padding: .8rem; border: 1px solid var(--atlas-line); background: var(--atlas-panel); }.case-card.selected { border-color: var(--atlas-cyan); }.case-card-top, .case-card-meta, .case-card-actions { display: flex; justify-content: space-between; gap: .4rem; align-items: center; }.case-id, .source-status { font: 700 .56rem ui-monospace, monospace; letter-spacing: .06em; }.case-id { color: var(--atlas-cyan); }.source-status { color: var(--atlas-amber); text-align: right; }.case-card h3 { margin: .7rem 0 .35rem; font-size: .76rem; line-height: 1.25; }.case-card p { margin: 0; color: var(--atlas-muted); font-size: .67rem; line-height: 1.45; }.case-card-meta { margin-top: .8rem; color: var(--atlas-muted); font: .58rem ui-monospace, monospace; }.case-card-actions { margin-top: auto; padding-top: .8rem; }.case-card-actions a { color: var(--atlas-cyan); font: 700 .61rem ui-monospace, monospace; text-decoration: none; }.case-card-actions a + a { color: var(--atlas-muted); }.case-card-actions a:hover { color: var(--atlas-ink); }.empty-case { grid-column: 1/-1; padding: 1.2rem; border: 1px dashed var(--atlas-line-strong); color: var(--atlas-muted); text-align: center; font-size: .75rem; }.atlas-footer { display: flex; justify-content: space-between; gap: .8rem; margin-top: 1.6rem; padding-top: .8rem; border-top: 1px solid var(--atlas-line); color: var(--atlas-muted); font: .6rem ui-monospace, monospace; }
	.atlas-shell { padding: 1.25rem 1.25rem 3.5rem; box-sizing: border-box; border: 1px solid rgba(117,210,224,.15); background: radial-gradient(circle at 12% 0%, rgba(35,93,112,.18), transparent 36%), var(--atlas-bg); }
	@media (max-width: 1080px) { .atlas-main-grid { grid-template-columns: minmax(0, 1.35fr) minmax(19rem, .9fr); }.symptom-matrix { grid-template-columns: repeat(3, 1fr); }.case-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 820px) { .atlas-shell { width: min(100% - 1rem, 760px); }.atlas-header { align-items: start; flex-direction: column; }.header-actions { width: 100%; justify-items: start; }.atlas-main-grid { grid-template-columns: 1fr; }.inspector { position: static; }.fault-layout { grid-template-columns: 1fr; }.fault-metrics { grid-template-columns: repeat(3, 1fr); }.trace-grid { grid-template-columns: 1fr; gap: .35rem; }.trace-label { margin-top: .25rem; }.trace-connector { display: block; position: absolute; left: 50%; bottom: -.6rem; z-index: 2; color: var(--atlas-cyan); }.trace-column:last-child .trace-connector { display: none; } }
	@media (max-width: 560px) { .atlas-shell { padding-top: .5rem; }.atlas-toolbar { align-items: stretch; flex-direction: column; }.mode-switch button { flex: 1; justify-content: center; }.reset-button { align-self: flex-end; }.pc-svg { min-height: 300px; }.model-legend { gap: .45rem .7rem; font-size: .58rem; }.panel-heading h2, .section-title h2 { font-size: 1.05rem; }.symptom-matrix, .case-grid { grid-template-columns: 1fr; }.fault-metrics { grid-template-columns: 1fr; }.trace-caption { max-width: 8rem; text-align: right; }.atlas-footer { display: grid; gap: .45rem; }.case-card-actions { align-items: start; flex-wrap: wrap; } }
	@media (prefers-reduced-motion: reduce) { .atlas-shell *, .atlas-shell *::before, .atlas-shell *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; } }
</style>
